import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Loads the conversation SlotMap augmentation (registers the
// 'conversation.input.right' slot key the optimize button occupies).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Loads the Plugin-manager page SlotMap augmentation: its `plugins.*` seats are
// the Plugins page's public extension points, and `plugins.bundle.config` (the
// per-bundle configuration seat) is where this plugin's settings page lives.
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { TYPERT_REMOTE } from '../remote.js'
import type { BetterInputRemote } from '../remote.js'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { BETTER_INPUT_NS, en, zh } from './strings.js'
import type { SettingsFace } from './MicrophoneButton.js'
import { OptimizeButton } from './OptimizeButton.js'
import { BetterInputPluginConfig } from './settings.jsx'
import { SettingsController, useSettingsSnapshot } from './settings-controller.js'

/** Required Client services: the slot registry, the Typert remote hub, and
 * the DSH locale runtime. `remote.betterInput` is mounted by this plugin's
 * own apply() via `ctx.remote.$mount`, so it MUST NOT appear here — the
 * outer inject gates plugin activation and would deadlock waiting for
 * itself. It is declared only on the inner ctx.inject() below, which runs
 * after the mount. Settings never come from a top-level `settings` service:
 * the plugin owns its settings document on the Host, so the Plugins page
 * reads them through this plugin's own `remote.betterInput` RPC. */
export const inject = ['slots', 'remote', 'locale']

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)
  // Register our bilingual dictionary with the DSH locale runtime BEFORE any
  // slot renders, so the injected `t` seat never hits a missing namespace.
  const disposeLocaleDicts = ctx.locale.register(BETTER_INPUT_NS, { zh, en })
  await ctx.inject(['slots', 'remote', 'remote.betterInput'], async (remoteCtx) => {
    const remote = remoteCtx.remote.betterInput as BetterInputRemote
    const controller = new SettingsController(remote)

    remoteCtx.effect(() => () => {
      controller.dispose()
    }, 'dsh-better-input settings lifecycle')

    void controller.refreshSettings()
    void controller.refreshRoutes()

    const useSettings = (): SettingsFace => {
      const snapshot = useSettingsSnapshot(controller)
      if (snapshot.status !== 'ready') return { status: 'loading', settings: snapshot.view.settings }
      return { status: 'ready', settings: snapshot.view.settings }
    }

    // The sparkle (prompt-optimize) button sits inline inside the
    // `conversation.input.right` toolbar, immediately to the left of the
    // microphone. order = 9998 places it one slot before the mic (9999),
    // which is the rightmost edge of the public right slot — the model
    // picker and send button follow in their own, non-slot seats.
    remoteCtx.slots.inject('conversation.input.right', () =>
      remoteCtx.slots.register(
        {
          name: 'conversation.input.right',
          id: 'better-input-optimize',
          order: 9998,
          locale: BETTER_INPUT_NS,
          inject: () => ({
            remote,
            useSettings
          })
        },
        OptimizeButton
      )
    )

    // The settings page lives on the Plugins page, not on a top-level settings
    // page of its own: `plugins.bundle.config` is keyed by bundle package name
    // and is rendered inline on that bundle's page (between its description and
    // its rows) with `view: 'page'`. Registering here merges the former
    // settings entry and its content into the plugin's own page, so the page's
    // configuration section appears only because this entry exists. The
    // `inject` wait is deliberate — the Plugins page is what declares this
    // keyed seat, so the registration lands with the declaration.
    remoteCtx.slots.inject('plugins.bundle.config', () =>
      remoteCtx.slots.register(
        {
          name: 'plugins.bundle.config',
          key: 'dsh-better-input',
          locale: BETTER_INPUT_NS,
          inject: () => ({ settingsController: controller })
        },
        BetterInputPluginConfig
      )
    )

    return () => {
      // Slots and effects are disposed through their own fiber.
    }
  })

  return async () => {
    disposeLocaleDicts()
    await disposeRemote()
  }
}
