import type { UserConfig } from 'tsdown'

/**
 * Specifiers the client bundle must resolve from the browser module table
 * instead of inlining.
 *
 * Two rules keep this list honest:
 * - every entry must be a module that actually exists in the DSH release the
 *   plugin targets (`@deepseek-ai/dsh-client-runtime` was removed in 0.1.2 and
 *   is not imported here);
 * - every DSH package the client half imports must be listed, so a future
 *   value import can never inline a second copy of a shared plugin (a
 *   duplicate `slots` / `locale` / standard-source implementation would break
 *   the service singletons).
 *
 * Today every `@deepseek-ai/*` import under src/client is type-only and is
 * erased, so the produced bundle only requires react / react-dom /
 * react/jsx-runtime; the DSH entries below are inert but keep that rule
 * enforceable.
 */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-conversation/client',
  '@deepseek-ai/dsh-client-ui-chat/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-plugin-manager/client',
  '@deepseek-ai/dsh-client-ui-input-trigger/client',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-api-remotes/client'
] as const

export function clientBundle(id: string, entry: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: entry },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (specifier: string) => (CLIENT_EXTERNALS.includes(specifier as typeof CLIENT_EXTERNALS[number]) ? undefined : true)
    },
    outputOptions: {
      entryFileNames: 'client.js',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });'
    }
  }
}
