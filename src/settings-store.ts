/**
 * Host-side JSON file storage for dsh-better-input settings.
 *
 * Location: `~/.dsh/better-input/settings.json`. The plugin ships as a flat
 * bundle under node_modules, so anything stored next to the package would be
 * wiped on update — the only durable, dependency-free location is the user's
 * home directory (Node builtins only). This mirrors the discipline of the
 * prompt-template store in `./templates/store.ts`.
 *
 * The stored document is the plugin's own state, not a projection of the dsh
 * composition: dsh 0.1.7 stores settings as the Config schema of a composed
 * plugin entry, which ties user-facing settings to a `.volatile()` schema, an
 * opaque loader entry id, and a fiber remount on every write. Owning the
 * document keeps persistence deterministic and lets the service keep serving
 * settings whether or not a settings service is mounted.
 *
 * Writes are serialized through a promise chain and performed atomically
 * (temp file + rename), so a crash mid-write cannot truncate the document.
 * A corrupt file is quarantined aside once with a warning instead of failing
 * every subsequent call.
 */

import { constants } from 'node:fs'
import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { DEFAULT_SETTINGS, type BetterInputSettings } from './config.js'

/** Durable location of the settings document. */
export function defaultSettingsFilePath(): string {
  return join(homedir(), '.dsh', 'better-input', 'settings.json')
}

/** The stored override layer together with the flattened view derived from it. */
export interface SettingsSnapshot {
  /** Keys explicitly present in the stored document, in stored order. */
  readonly overridden: readonly string[]
  /** Stored values merged over {@link DEFAULT_SETTINGS}; every field populated. */
  readonly settings: BetterInputSettings
}

/** Outcome of probing one path for writability without creating anything. */
type WriteProbe = 'writable' | 'absent' | 'blocked'

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Flatten one stored record into a complete settings object. Every field falls
 * back to {@link DEFAULT_SETTINGS}, so a hand-edited or partially written
 * document can never yield a half-populated shape.
 */
function flattenStoredSettings(raw: unknown): BetterInputSettings {
  const record = isRecord(raw) ? raw : {}
  return {
    language: text(record.language),
    maxRecordingSeconds: typeof record.maxRecordingSeconds === 'number'
      ? record.maxRecordingSeconds
      : DEFAULT_SETTINGS.maxRecordingSeconds,
    polishingEnabled: record.polishingEnabled !== false,
    polishProvider: text(record.polishProvider),
    polishModel: text(record.polishModel),
    polishReasoningEffort: text(record.polishReasoningEffort),
    polishPrompt: typeof record.polishPrompt === 'string' ? record.polishPrompt : '',
    optimizeEnabled: record.optimizeEnabled !== false,
    optimizeProvider: text(record.optimizeProvider),
    optimizeModel: text(record.optimizeModel),
    optimizeReasoningEffort: text(record.optimizeReasoningEffort),
    optimizePrompt: typeof record.optimizePrompt === 'string' ? record.optimizePrompt : '',
    contextTurns: typeof record.contextTurns === 'number' ? record.contextTurns : DEFAULT_SETTINGS.contextTurns,
    ocrProvider: text(record.ocrProvider),
    ocrModel: text(record.ocrModel),
  }
}

function snapshotOf(stored: Record<string, unknown>): SettingsSnapshot {
  return { overridden: Object.keys(stored), settings: flattenStoredSettings(stored) }
}

/** Probe one path: writable, absent, or present-but-refusing writes. */
async function probePath(path: string, kind: 'file' | 'directory'): Promise<WriteProbe> {
  try {
    const stats = await stat(path)
    // A regular file can never contain the document, and an existing
    // non-directory here means the document could not be created at all.
    if (kind === 'directory' ? !stats.isDirectory() : !stats.isFile()) return 'blocked'
    await access(path, constants.W_OK)
    return 'writable'
  } catch (error) {
    // ENOTDIR (POSIX) and ENOENT (Windows reports a non-directory ancestor this
    // way) both mean "nothing lives here yet"; the walk-up decides the rest.
    if (isNodeError(error) && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return 'absent'
    return 'blocked'
  }
}

/**
 * Whether the document could be created under `filePath`: the closest existing
 * ancestor must be a directory that accepts new entries.
 */
async function canCreateAt(filePath: string): Promise<boolean> {
  let directory = dirname(filePath)
  for (;;) {
    const probe = await probePath(directory, 'directory')
    if (probe === 'writable') return true
    if (probe === 'blocked') return false
    const parent = dirname(directory)
    if (parent === directory) return false
    directory = parent
  }
}

export class SettingsStore {
  private cache: Record<string, unknown> | undefined
  private persistChain: Promise<unknown> = Promise.resolve()

  constructor(private readonly filePath: string = defaultSettingsFilePath()) {}

  /**
   * Read the stored override layer and its flattened view. A missing document
   * is the normal first-run case and yields the defaults with no overrides.
   * @throws Whatever the filesystem throws — a genuinely unreadable document is
   *   reported to the caller rather than silently replaced by defaults.
   */
  async read(): Promise<SettingsSnapshot> {
    return snapshotOf(await this.load())
  }

  /**
   * Merge one sparse patch into the stored layer and persist it atomically.
   * `undefined` entries are skipped, so a partial patch cannot erase a stored
   * key. Only the patch's own fields are written, which is what makes
   * {@link SettingsSnapshot.overridden} name exactly the keys the user set.
   * @param patch - fields to merge over the stored document.
   * @returns the stored overrides and flattened view after the write.
   * @throws Whatever the filesystem throws — a refused write never resolves.
   */
  async merge(patch: Readonly<Record<string, unknown>>): Promise<SettingsSnapshot> {
    const merged = await this.serialize(async () => {
      const stored = await this.load()
      const next: Record<string, unknown> = { ...stored }
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) next[key] = value
      }
      await this.writeAtomic(next)
      this.cache = next
      return next
    })
    return snapshotOf(merged)
  }

  /**
   * Whether a write could succeed here, probed without creating anything: the
   * existing document, otherwise the closest existing ancestor directory that
   * has to accept a new entry.
   */
  async isWritable(): Promise<boolean> {
    const own = await probePath(this.filePath, 'file')
    if (own === 'writable') return true
    if (own === 'blocked') return false
    return canCreateAt(this.filePath)
  }

  private async load(): Promise<Record<string, unknown>> {
    if (this.cache !== undefined) return this.cache
    let raw: string
    try {
      raw = await readFile(this.filePath, 'utf8')
    } catch (error) {
      // A missing document is the normal first-run case — but only when one
      // could actually be created here. A path blocked by a regular file or an
      // unwritable directory is a genuine failure, not an empty first run.
      if (isNodeError(error) && error.code === 'ENOENT' && await canCreateAt(this.filePath)) {
        this.cache = {}
        return this.cache
      }
      throw error
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      await this.quarantineCorruptFile()
      this.cache = {}
      return this.cache
    }
    if (!isRecord(parsed)) {
      await this.quarantineCorruptFile()
      this.cache = {}
      return this.cache
    }
    this.cache = { ...parsed }
    return this.cache
  }

  private async quarantineCorruptFile(): Promise<void> {
    try {
      await rename(this.filePath, `${this.filePath}.corrupt-${Date.now()}`)
      console.warn('[dsh-better-input] settings file was corrupt; moved aside and started fresh')
    } catch {
      // Best effort: the next atomic write recreates the file anyway.
    }
  }

  /**
   * Run one read-modify-write exclusively. The whole cycle is serialized, not
   * just the write, so two concurrent patches cannot both merge over the same
   * stale base. A rejection reaches its own caller without poisoning later work.
   */
  private serialize<T>(work: () => Promise<T>): Promise<T> {
    const task = this.persistChain.then(work, work)
    this.persistChain = task.then(() => undefined, () => undefined)
    return task
  }

  private async writeAtomic(stored: Record<string, unknown>): Promise<void> {
    const payload = `${JSON.stringify(stored, null, 2)}\n`
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      await writeFile(temporaryPath, payload, 'utf8')
      await rename(temporaryPath, this.filePath)
    } catch (error) {
      // Either step failing (ENOSPC on the write, EPERM/EXDEV on the rename, a
      // directory appearing at the target) must not strand the temp file:
      // without this the document directory accumulates
      // `settings.json.<pid>.tmp` files. Best effort — the original error is
      // what the caller needs to see, and `force` tolerates "never created".
      await rm(temporaryPath, { force: true }).catch(() => undefined)
      throw error
    }
  }
}
