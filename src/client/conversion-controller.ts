import type { InputTriggerController, TriggerHit } from '@deepseek-ai/dsh-client-ui-input-trigger/client'
import type { ConversionItem } from './conversion-types.js'
import { ConversionStore } from './conversion-store.js'
import { CONVERSION_SOURCE_NAME } from './conversion-source.js'

/**
 * The composer shell slice this plugin reads. `SessionInputShell` exposes the
 * live input state through `get snapshot(): InputState`
 * (`client/input/facade.ts`), whose `draftRev` is the pick-time CAS material a
 * synthetic trigger hit must carry.
 */
interface InputShellLike {
  readonly snapshot: { readonly draftRev: number }
}

/**
 * The runtime slice of the conversation input hub we depend on. The public
 * `IConversation` type declares only `input: SessionInputResolver` (`for()`),
 * but the concrete hub behind it — `InputHub`, documented as exactly
 * `ctx.conversation.input` (`client/input/hub.ts`) — also exposes
 * `inputTriggers(id): InputTriggerController | undefined` and
 * `shell(id): SessionInputShell`. Both halves are named with their real
 * declarations so the synthetic hit below stays compiler-checked.
 */
export interface ConversationInputHubHandle {
  inputTriggers(sessionId: string): InputTriggerController | undefined
  shell(sessionId: string): InputShellLike
}

/**
 * Bridges the file-conversion dock to the composer's chip pipeline.
 *
 * `ctx.conversation.input` is the conversation input hub. At runtime it exposes
 * `inputTriggers(sessionId)` (a session-scoped controller launcher) and
 * `shell(sessionId)` (the composer shell whose snapshot carries the draft
 * revision for a correct CAS span) — mirroring how dsh itself launches the
 * command menu from composer chrome.
 */
export class ConversionController {
  /** The shared result store (one per plugin instance). */
  readonly store: ConversionStore
  private readonly hub: ConversationInputHubHandle

  constructor(store: ConversionStore, hub: ConversationInputHubHandle) {
    this.store = store
    this.hub = hub
  }

  /** Store a converted document and open the single-source picker menu so the
   *  user confirms inserting it as an inline chip. */
  insertConversion(sessionId: string, item: ConversionItem): void {
    this.store.set(item)
    const controller = this.hub.inputTriggers(sessionId)
    if (controller === undefined) return
    const shell = this.hub.shell(sessionId)
    const draftRev = shell?.snapshot?.draftRev ?? 0
    const hit: TriggerHit = {
      trigger: '@',
      query: '',
      quoted: false,
      position: 'inline',
      span: { start: 0, end: 0, draftRev },
    }
    controller.toggleSource(CONVERSION_SOURCE_NAME, hit)
  }

  /** Remove a conversion by ref (discarded / no longer needed). */
  removeConversion(ref: string): void {
    this.store.delete(ref)
  }

  /** Replace the stored Markdown of one conversion (edit-in-place). */
  editConversion(ref: string, markdown: string): boolean {
    return this.store.updateMarkdown(ref, markdown)
  }
}