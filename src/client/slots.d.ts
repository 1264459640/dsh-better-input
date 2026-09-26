/**
 * Host-provided `slots` service type.
 *
 * At runtime `ctx.slots` is `SlotRegistry`, provided by
 * `@deepseek-ai/dsh-client-ui-renderer` (`lib/types/client/registry.d.ts`:
 * `class SlotRegistry extends Service`, and its `client/index.d.ts` merges
 * `Context.slots: SlotRegistry`). A plugin that does not depend on the
 * renderer package cannot name that type, so this file re-declares the two
 * members this plugin uses and mirrors their real signatures exactly:
 *
 * - `register` — the core `SlotCore['register']` typed face, reused verbatim
 *   (never re-typed), which is what keeps every `register()` call checked
 *   against the declaration-merged SlotMap;
 * - `inject` — one synchronous effect per declaration lifetime of a slot key,
 *   returning the callback's product; the signature below is the renderer's
 *   `inject(key, callback)` narrowed to the same shape.
 *
 * Keep both in step with the renderer's registry.d.ts: a widened copy here
 * (e.g. `inject(name: string, contribute: () => unknown)`) silently un-checks
 * every slot key and every returned disposer in this plugin.
 */
import type { SlotCore, SlotMap } from '@deepseek-ai/dsh-client-ui-slots'

/** One synchronous effect installed while an injected slot declaration is live. */
type SlotInjectionEffect = (() => void) | Iterable<() => void>

interface BetterInputSlotsService extends SlotCore {
  /**
   * Install an effect for each declaration lifetime of a slot. The callback
   * runs synchronously when the declaration already exists; otherwise it runs
   * inside the declaring `register()` call after the declaration is committed.
   * @param key - declared SlotMap key to depend on.
   * @param callback - creates one disposer, or an iterable of disposers.
   * @returns idempotent disposer for the wait and any active effect.
   */
  inject(key: keyof SlotMap & string, callback: () => SlotInjectionEffect): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: BetterInputSlotsService
  }
}
