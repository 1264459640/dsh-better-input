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
import { type BetterInputSettings } from './config.js';
/** Durable location of the settings document. */
export declare function defaultSettingsFilePath(): string;
/** The stored override layer together with the flattened view derived from it. */
export interface SettingsSnapshot {
    /** Keys explicitly present in the stored document, in stored order. */
    readonly overridden: readonly string[];
    /** Stored values merged over {@link DEFAULT_SETTINGS}; every field populated. */
    readonly settings: BetterInputSettings;
}
export declare class SettingsStore {
    private readonly filePath;
    private cache;
    private persistChain;
    constructor(filePath?: string);
    /**
     * Read the stored override layer and its flattened view. A missing document
     * is the normal first-run case and yields the defaults with no overrides.
     * @throws Whatever the filesystem throws — a genuinely unreadable document is
     *   reported to the caller rather than silently replaced by defaults.
     */
    read(): Promise<SettingsSnapshot>;
    /**
     * Merge one sparse patch into the stored layer and persist it atomically.
     * `undefined` entries are skipped, so a partial patch cannot erase a stored
     * key. Only the patch's own fields are written, which is what makes
     * {@link SettingsSnapshot.overridden} name exactly the keys the user set.
     * @param patch - fields to merge over the stored document.
     * @returns the stored overrides and flattened view after the write.
     * @throws Whatever the filesystem throws — a refused write never resolves.
     */
    merge(patch: Readonly<Record<string, unknown>>): Promise<SettingsSnapshot>;
    /**
     * Whether a write could succeed here, probed without creating anything: the
     * existing document, otherwise the closest existing ancestor directory that
     * has to accept a new entry.
     */
    isWritable(): Promise<boolean>;
    private load;
    private quarantineCorruptFile;
    /**
     * Run one read-modify-write exclusively. The whole cycle is serialized, not
     * just the write, so two concurrent patches cannot both merge over the same
     * stale base. A rejection reaches its own caller without poisoning later work.
     */
    private serialize;
    private writeAtomic;
}
