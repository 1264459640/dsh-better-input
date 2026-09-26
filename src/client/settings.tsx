import { useEffect, useState } from 'react'
import type { BetterInputSettingsPatch, ReasoningEffortInfo } from '../config.js'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsController } from './settings-controller.js'
import { useEffortsSnapshot, useSettingsSnapshot, useRoutesSnapshot } from './settings-controller.js'

/** The framework-injected `t` seat for the BetterInput namespace. */
type Translate = TranslateNS<'better-input'>

function ReasoningEffortSelect(props: {
  settingsController: SettingsController
  provider: string
  model: string
  storedEffort: string
  onChange: (effortId: string) => void
  t: Translate
}) {
  const { settingsController, provider, model, storedEffort, onChange, t } = props
  const efforts = useEffortsSnapshot(settingsController)

  // Kick off the lazy fetch whenever the selected model changes.
  useEffect(() => {
    if (provider === '' || model === '') return
    void settingsController.ensureEffortsFor(provider, model)
  }, [settingsController, provider, model])

  if (provider === '' || model === '') return null
  const key = `${provider}\u0000${model}`
  const entry = efforts[key]

  // Not yet requested / loading → show a disabled placeholder so the user
  // knows the field exists but is warming up.
  if (entry === undefined || entry.status === 'loading') {
    return (
      <select value="" disabled={true} style={inputStyle}>
        <option value="">{t('effortLoadingLabel')}</option>
      </select>
    )
  }
  if (entry.status === 'error' || entry.efforts.length === 0) {
    // Nothing to show; silently hide like the "no efforts" case so the UI
    // doesn't constantly surface adapter metadata misses for regular models.
    return null
  }
  // The default option means "let the Host decide" — it prefers the model's
  // `off` tier, so we no longer surface the adapter's defaultEffort here.
  const items: readonly ReasoningEffortInfo[] = entry.efforts
  return (
    <select
      value={storedEffort}
      onChange={(event) => onChange(event.target.value)}
      style={inputStyle}
    >
      <option value="">{t('effortDefaultLabel')}</option>
      {items.map((effort) => (
        <option key={effort.id} value={effort.id} title={effort.description}>
          {effort.name}
        </option>
      ))}
    </select>
  )
}

export type BetterInputPluginConfigProps = {
  readonly t: Translate
  readonly settingsController: SettingsController
}

type FieldState = {
  text: string
  invalid: boolean
}

/**
 * The BetterInput settings page. It owns the prompt-optimization configuration
 * only (model, thinking effort, custom prompt, context turns) and is rendered
 * inline on this bundle's own page inside the Plugins page, through the keyed
 * `plugins.bundle.config` seat (key = the bundle package name, `view: 'page'`).
 * That page draws the title, icon, and crumb itself and passes no dismissal
 * callback to slot components.
 */
export function BetterInputPluginConfig({ settingsController, t }: BetterInputPluginConfigProps) {
  const settings = useSettingsSnapshot(settingsController)
  const routes = useRoutesSnapshot(settingsController)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saveFailed, setSaveFailed] = useState(false)
  const [showDefaultOptimizePrompt, setShowDefaultOptimizePrompt] = useState(false)

  useEffect(() => {
    void settingsController.refreshSettings()
    void settingsController.refreshRoutes()
  }, [settingsController])

  if (settings.status === 'loading' || routes.status === 'loading') {
    return <SectionFrame title={t('settingsTitle')}>{t('loading')}</SectionFrame>
  }

  const field = (name: string, current: string): FieldState => ({
    text: drafts[name] ?? current,
    invalid: false
  })

  const setField = (name: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [name]: value }))
  }

  const save = async (patch: BetterInputSettingsPatch) => {
    setSaveFailed(false)
    const ok = await settingsController.update(patch)
    if (ok) {
      setDrafts((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(patch)) delete next[key]
        return next
      })
    } else {
      setSaveFailed(true)
    }
  }

  const s = settings.view.settings
  const optimizePromptField = field('optimizePrompt', s.optimizePrompt)
  const contextTurnsField = field('contextTurns', String(s.contextTurns))

  return (
    <SectionFrame title={t('settingsTitle')}>
      <p style={hintStyle}>{t('settingsDescription')}</p>

      {saveFailed ? <p style={errorStyle}>{t('saveFailed')}</p> : null}

      <Field label={t('optimizeModelLabel')} hint={t('optimizeModelHint')}>
        <select
          value={drafts.optimizeProvider !== undefined || drafts.optimizeModel !== undefined
            ? `${drafts.optimizeProvider ?? s.optimizeProvider}\u0000${drafts.optimizeModel ?? s.optimizeModel}`
            : `${s.optimizeProvider}\u0000${s.optimizeModel}`}
          onChange={(event) => {
            const [provider, model] = event.target.value.split('\u0000')
            void save({ optimizeProvider: provider ?? '', optimizeModel: model ?? '' })
          }}
          style={inputStyle}
          disabled={routes.status !== 'ready' || routes.routes.length === 0}
        >
          <option value={'\u0000'}>{t('polishModelNone')}</option>
          {routes.status === 'ready' && routes.routes.map((route) => (
            <option key={`${route.provider}\u0000${route.model}`} value={`${route.provider}\u0000${route.model}`}>
              {route.providerName} / {route.modelName}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('optimizeEffortLabel')} hint={t('optimizeEffortHint')}>
        <ReasoningEffortSelect
          settingsController={settingsController}
          provider={s.optimizeProvider}
          model={s.optimizeModel}
          storedEffort={s.optimizeReasoningEffort}
          onChange={(effortId) => void save({ optimizeReasoningEffort: effortId })}
          t={t}
        />
      </Field>

      <Field label={t('optimizePromptLabel')} hint={t('optimizePromptHint')}>
        <textarea
          value={optimizePromptField.text}
          rows={5}
          placeholder={t('optimizePromptPlaceholder')}
          onChange={(event) => setField('optimizePrompt', event.target.value)}
          onBlur={() => void save({ optimizePrompt: optimizePromptField.text })}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
        />
        {settings.view.defaultOptimizePrompt !== '' ? (
          <div>
            <button
              type="button"
              onClick={() => setShowDefaultOptimizePrompt((prev) => !prev)}
              style={toggleLinkStyle}
            >
              {showDefaultOptimizePrompt ? t('hideDefaultPrompt') : t('showDefaultPrompt')}
            </button>
            {showDefaultOptimizePrompt ? (
              <pre
                style={{
                  margin: '6px 0 0',
                  padding: 8,
                  maxHeight: 220,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 11,
                  lineHeight: 1.5,
                  background: 'var(--dsw-alias-bg-layer-1, rgba(0,0,0,0.03))',
                  border: '1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.3))',
                  borderRadius: 6,
                  fontFamily: 'monospace'
                }}
              >
                {settings.view.defaultOptimizePrompt}
              </pre>
            ) : null}
          </div>
        ) : null}
      </Field>

      <Field label={t('contextTurnsLabel')} hint={t('contextTurnsHint')}>
        <input
          type="number"
          min={0}
          max={20}
          value={contextTurnsField.text}
          onChange={(event) => setField('contextTurns', event.target.value)}
          onBlur={() => {
            const parsed = Number(contextTurnsField.text)
            if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 20) return
            void save({ contextTurns: parsed })
          }}
          style={inputStyle}
        />
      </Field>

      <p style={hintStyle}>
        {t('routesStatus')}: {routes.status === 'ready' ? `${routes.routes.length}` : routes.detail || t('routesUnavailable')}
      </p>
    </SectionFrame>
  )
}

function SectionFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {children}
      <span style={hintStyle}>{hint}</span>
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.4))',
  background: 'var(--dsw-alias-bg-layer-1, #f9f9f9)',
  color: 'var(--dsw-alias-label-primary, inherit)',
  fontSize: 13
}

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  opacity: 0.7
}

const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--dsw-alias-state-error-primary, #e5484d)'
}

const toggleLinkStyle: React.CSSProperties = {
  marginTop: 6,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--dsw-alias-state-business-primary, #4f8cff)',
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'underline'
}
