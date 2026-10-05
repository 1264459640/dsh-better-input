# Changelog

Versioned release notes for this repository, maintained from here on. This is the English mirror; Chinese is authoritative — see [CHANGELOG.md](CHANGELOG.md).

## [0.2.5] - unreleased

### Changed

- **Track dsh 0.2.0-rc.2**: the 13 dev-dependency type packages (`dsh-api-gateway` / `dsh-api-remotes` / `dsh-attachment` / `dsh-client-locale` / `dsh-client-store` / `dsh-client-ui-chat` / `dsh-client-ui-conversation` / `dsh-client-ui-input-trigger` / `dsh-client-ui-plugin-manager` / `dsh-client-ui-settings` / `dsh-client-ui-slots` / `dsh-llm` / `dsh-typert-protocol`) were all bumped to `0.2.0-rc.2`, and the `@deepseek-ai/cordis` peer was tightened to `~4.0.4` (the 0.2.0-track official packages generally declare `cordis ~4.0.4`). Three dev dependencies were added — `@deepseek-ai/dsh-brand` / `@deepseek-ai/dsh-client-connection` / `@deepseek-ai/dsh-scope` — because the 0.2.0 track introduced them as transitive peers (`dsh-attachment` → `dsh-brand`, `dsh-api-gateway` → `dsh-client-connection`, `dsh-api-remotes` → `dsh-scope`); without declaring them, `npm install` fails outright with ERESOLVE.
- **Peer ranges widened to `>=0.1.7-rc.2 <0.3.0-0` (the root-cause fix of this release)**: before loading each bundle, the 0.2.0-track launcher calls `evaluatePluginCompatibility` from `@deepseek-ai/dsh-app-boot`, which tests every peer named `@deepseek-ai/dsh` or `@deepseek-ai/dsh-*` with `semver.satisfies(runtime, range, { includePrerelease: true })` and **skips the whole bundle** if any one fails. The `>=0.1.7-rc.2 <0.2.0-0` range declared by 0.2.4 is judged incompatible on the 0.2.0 track, so the host log showed `skipping profile bundle "dsh-better-input": Error: Plugin dsh-better-input@0.2.4 is incompatible with dsh 0.2.0-rc.1` and the plugin vanished from the UI entirely — the `conversation.input.right` slot itself was still there (`available: true`), it simply had no occupants, and the settings entry no longer appeared. This was a load-time version gate, not a runtime error. **No functional source change was needed**: the same code passes `tsc --noEmit` on `0.1.7-rc.2`, `0.2.0-rc.1` and `0.2.0-rc.2`, so the range now honestly covers both tracks instead of dropping 0.1.7.
- **The fix was confirmed on this machine**: judged by the real `evaluatePluginCompatibility`, `0.2.0-rc.2` / `0.2.0-rc.1` / `0.2.0` / `0.1.7-rc.2` are compatible while `0.1.5-rc.1` and `0.3.0-rc.1` are still correctly rejected; after installing 0.2.5 into the local profile, the 0.2.0-rc.2 startup gate reports `dsh-better-input@0.2.5` as **COMPATIBLE** (it had been one of the 9 skipped bundles). Two further runtime verifications were run: the host half (Cordis mount, `validateTypertManifest`, registration against the real `TypertRegistry`, `listRoutes`/`polish` against the real `LlmRuntime`, settings and template round-trips) passed item by item; and on the browser side the `lib/client.js` module-table contract passed 12/12, while `@deepseek-ai/dsh-client-ui-renderer`'s `lib/types/client/registry.d.ts` (where `SlotRegistry.inject` is defined) is **byte-identical** across `0.1.7-rc.2` / `0.2.0-rc.1` / `0.2.0-rc.2`, so the hand-written mirror in `src/client/slots.d.ts` is still exact. It was also observed live on the local 0.2.0-rc.2 instance: both `conversation.input.right` (`better-input-optimize`, order 9998) and `plugins.bundle.config` (key `dsh-better-input`) show this plugin's entry as active, and the Host loader tree carries a `dsh-better-input` entry.

### Notes

- **This release changes no user-visible behaviour**: the fix is in `package.json`'s `peerDependencies`. Features, the settings file location and format, and the remote contract are identical to 0.2.4. Upgrading from 0.2.4 needs no reconfiguration.
- **The first load needs a dsh restart**: both the bundle list and the version gate are settled at host startup, so dsh must be restarted (or the plugin reloaded through the plugin manager) before the plugin reappears.

## [0.2.4] - unreleased

### Changed

- **Track dsh 0.1.7-rc.2**: the dev-dependency type packages (`dsh-client-ui-conversation` / `dsh-client-ui-chat` / `dsh-client-ui-slots` / `dsh-client-ui-input-trigger` / `dsh-client-ui-settings` / `dsh-client-ui-plugin-manager` / `dsh-client-store` / `dsh-client-locale` / `dsh-api-remotes` / `dsh-llm` / `dsh-typert-protocol` / `dsh-attachment`) were all bumped to `0.1.7-rc.2`, and `@deepseek-ai/dsh-api-gateway` was added (it restores type resolution for the remote calls — see Fixed); `@deepseek-ai/cordis` is at `4.0.4` (`@deepseek-ai/schemastery` and `@deepseek-ai/dsh-settings` were removed along with the settings schema — see below).
- **Peer ranges narrowed to `>=0.1.7-rc.2 <0.2.0-0`**: 0.1.7 removed the settings-registration API this project used, and the Typert codec field shape changed as well (see below), so the older tracks (0.1.2 / 0.1.5) can no longer run this version. The previous `>=0.1.2-rc.1 <0.2.0-0` range would have been a false promise in this release.
- **Adapted to the Typert remote protocol's codec shape change**: as of 0.1.7 a codec no longer accepts `schema`; it takes a lazily-built `create: () => schema` instead. All 27 sites in `src/remote.ts` were migrated, while the 27 duplicates in `src/typert.ts` were deleted in favour of a single shared definition (see Fixed). The browser-side RPC contract (method names, parameters, result shapes, `AbortSignal` cancellation) was compared item by item and is unchanged.
- **Settings storage is now owned by the plugin (`~/.dsh/better-input/settings.json`)**: 0.1.7 removed `settings.register(namespace, schema, { validate })` and no longer exports `SettingsScope`, so the previous registration path has no counterpart API. The official replacement requires the plugin to export a cordis `Config`, mark every field `.volatile()` or `settings.describe()` silently skips the entry, recover its own loader entry id through internals such as `ctx.fiber.entry` / `ctx.root.loader.locate`, and write to the plugin's *load-time* configuration (which may restart the fiber). Any drift there degrades silently to "settings unavailable", which the user only perceives as settings failing to save. Settings now use the same persistence approach as this repository's template library (`src/templates/store.ts`): writes go through a temp file plus atomic rename, a corrupt file is quarantined as `*.corrupt-<timestamp>` and rebuilt, and a failed write rejects instead of pretending to have saved. The settings UI and the remote interface are unchanged.
- **Removed dependencies and dead code that this migration obsoleted**: `@deepseek-ai/schemastery` and `@deepseek-ai/dsh-settings` were dropped from the peer/dev dependencies (the former served only the deleted settings schema; the `SettingsScope` and settings-registration APIs the latter provided no longer exist in 0.1.7), and `src/config-schema.ts` plus the now-dead `SETTINGS_NAMESPACE` constant were deleted. `@deepseek-ai/dsh-client-store` is kept: it is still the defining source of `SnapshotSelectorHook`, only reached indirectly through `dsh-client-ui-slots`, and dropping it would let that type silently collapse to `any`.
- **Corrected the client injection list (`dsh.client.inject`)**: the old list named `@deepseek-ai/dsh-client-ui-slots` as an injected package (it has no `dsh.client` row in 0.1.7-rc.2, so that edge was inert) while omitting `@deepseek-ai/dsh-client-ui-renderer`, the actual provider of `ctx.slots`, along with the providers of `inputTriggers` / `locale` / `remote` / `settings.section`. The list now names the eight packages whose services the browser half uses: `@deepseek-ai/dsh-client-ui-plugin-manager` was appended when the settings page moved into the Plugins page (see below).
- **Only prompt optimization is kept; every other feature is unbound**: the client registration surface no longer contributes voice input, AI polishing, local file-to-Markdown conversion (including OCR), or the prompt-template library — `src/client/index.ts` keeps only the prompt-optimization button (`conversation.input.right`). The source files and dependencies behind those features are kept in the repository but unbound, so they no longer reach the bundle. The settings page's "About & updates" block and its Host surface were removed as well: the `getAbout` / `checkForUpdate` RPCs (their entries in `src/remote.ts`, `src/remote-contract.ts`, `src/polish/service.ts`, and `src/typert.ts`) and `src/about.ts` are gone.
- **The settings page moved into the Plugins page**: the standalone settings page registered under `settings.section` is now a `plugins.bundle.config` contribution declared by the Plugins page (plugin-manager), keyed by that bundle's package name `dsh-better-input`; the settings render inline on the plugin's own detail page (between its description and its rows), the sidebar no longer carries a separate BetterInput settings entry, and the component is renamed `BetterInputPluginConfig`. That seat is a **keyed** slot, so the registration must use `key` — `id` would be silently ignored (dispatch reads `options.key`). This added `@deepseek-ai/dsh-client-ui-plugin-manager` (a type-only `import type` contract merge, one row in the client injection list for load ordering, plus peer range and exact dev pin) and one entry in `tsdown.client.ts`'s `CLIENT_EXTERNALS`, so a future value import cannot inline a second copy.

### Fixed

- **`src/typert.ts`'s host manifest was never type-checked — and on 0.1.7 it would have failed plugin registration outright**: DSH's typert loader imports this package's `./typert` export and validates it with `validateTypertManifest`, whose `requireStrictCodec` throws `"has no create() factory"` when a codec lacks `create()`. Upgrading the dependencies alone would therefore have made the plugin fail to load at the typert registration stage. Because that file exported with `as const` and was never compared against the protocol types, `tsc` gave no hint — which is precisely how this codec change stayed hidden. `invocations` now comes from the already protocol-typed `TYPERT_REMOTE.descriptors`, so the host and client faces share one definition: drift is no longer merely detectable, it is impossible.
- **Remote calls were not type-checked at all**: `@deepseek-ai/dsh-api-remotes/client` type-imports `@deepseek-ai/dsh-api-gateway/client`, which was not among this project's dependencies, and `skipLibCheck` swallowed the unresolved-module error — so `ClientRemote` silently collapsed to `any` and all 12 remote methods' names, arities and return types went unchecked (and this migration changed exactly that protocol). `@deepseek-ai/dsh-api-gateway` is now in the peer/dev dependencies; an `IsAny<>` probe confirms `ClientRemote` resolves to a real type again and all 12 call sites type-check.
- **The local `ctx.slots` declaration in `src/client/slots.d.ts` was wider than the real service**: `inject(name: string, contribute: () => unknown): unknown` let any string pass as a slot key. It is now matched to the real `SlotRegistry.inject(key: keyof SlotMap & string, cb)` from `@deepseek-ai/dsh-client-ui-renderer`; a mistyped slot key or a wrong disposer return type now fails to compile (verified with negative controls). The hand-rolled duck type in `src/client/conversion-controller.ts` was likewise replaced with the real `InputTriggerController` / `TriggerHit`, so the synthetic trigger hit (`toggleSource`) is compiler-checked too.
- **Removed a build external pointing at a deleted package**: `CLIENT_EXTERNALS` in `tsdown.client.ts` still listed `@deepseek-ai/dsh-client-runtime/client`, removed upstream in 0.1.2. It is gone, and the other DSH packages the client imports were added so a future value import cannot inline a second copy of a shared plugin and break the service singletons.

### Note

- **Settings saved by older versions are not migrated automatically**: 0.2.3 and earlier registered this plugin's settings as a DSH settings namespace, which kept the values inside DSH's own configuration. 0.1.7 removed that registration API, so this release owns its document at `~/.dsh/better-input/settings.json` instead. Upgrading therefore starts from defaults, and the polish / optimize / OCR model choices plus any custom prompts have to be re-selected in Settings. The prompt-template library (`templates.json`) is unaffected and stays where it was. Like the existing template store, this file lives under `~/.dsh/` and does not honour `$DSH_HOME`.

## [0.2.3] - unreleased

### Changed

- **Track dsh 0.1.5-rc.1 while staying backward-compatible**: the peer ranges stay `>= 0.1.2-rc.1 <0.2.0-0` (this range naturally covers both the 0.1.2 and 0.1.5 tracks), and the dev-dependency type packages (`dsh-client-ui-conversation` / `dsh-client-ui-chat` / `dsh-client-ui-slots` / `dsh-client-ui-input-trigger` / `dsh-client-ui-settings` / `dsh-client-store` / `dsh-client-locale` / `dsh-api-remotes` / `dsh-llm` / `dsh-settings` / `dsh-typert-protocol` / `dsh-attachment`) were all bumped to `0.1.5-rc.1`. Tested against official 0.1.5-rc.1: the core slots (`conversation.input.dock` / `conversation.input.right` / `settings.section`) are unchanged and conflict-free with the older track; 0.1.5's general-purpose file upload is a Composer-internal capability not exposed to plugins, so the file-to-Markdown / OCR entry points remain as-is.

## [0.2.2] - unreleased

### Changed

- **Fully migrate to dsh 0.1.2-rc.1 and drop the deprecated `@deepseek-ai/dsh-client-runtime` dependency**: that assembly package was removed upstream in 0.1.2; the earlier 0.2.1 fix still sat on the old runtime track. Now migrated wholesale to the 0.1.2 track — `ClientContext` uses the standardized cordis `Context` alias; the five server-side packages (`dsh-api-remotes` / `dsh-llm` / `dsh-settings` / `dsh-typert-protocol` / `dsh-attachment`) were bumped to the `0.1.2-rc.1` track; and `@deepseek-ai/dsh-client-ui-chat` was added to read the message history.
- **Prompt optimization now reads session context via `useChat` + `chat.legacy.nodes`**: the message-history source is unified on the Chat target's `legacy.nodes`. Because the `ConversationNode` type in 0.1.2 depends on third-party type packages (`dsh-commands` / `dsh-llm-retry` / `dsh-tool-todo`) that are not shipped with this plugin and collapse to `any` under `skipLibCheck`, text extraction now uses a local minimal structural type `ConversationNodeView` and no longer depends on resolving those packages.
- **Removed the deleted `settingsNamespace()` call**: in 0.1.2 `SettingsNamespace` became a branded type instead of a function; `settings.register` accepts the namespace literal directly, and the `validate` option stays signature-compatible.
- **Added compile-time types for the host-injected `slots` service**: 0.1.2 removed the runtime package that carried the `ctx.slots` augmentation, and that service's public type no longer ships with any plugin dependency. Following the harness ecosystem convention (plugins declare a minimal ClientContext themselves, see dsh-routing-suite), a new `slots.d.ts` ambient declaration was added — `register` reuses the strongly-typed `SlotCore` contract from `dsh-client-ui-slots`, plus the host's `inject(name, contribute)` wiring face.

## [0.2.1] - 2026-09-07

### Fixed

- **Compatibility with the dsh 0.1.2-rc.1 UI injection refactor**: that release made a breaking change to the `conversation.input.right` slot, no longer injecting owner `input` / `session` props into entries, which broke rendering of the microphone and prompt-optimize buttons (they disappeared from the composer). Both now read the draft and the conversation snapshot through the framework's standard `useInput` / `useSession` hooks instead of the removed owner props.
- **Fix `session.nodes is not iterable` on clicking "prompt optimize"**: dsh 0.1.2 restructured the conversation snapshot — the top-level `nodes` field is no longer an array at runtime, and the ordered message array moved to `chat.legacy.nodes`. Context extraction now reads defensively: it prefers the array when present and falls back to `chat.legacy.nodes`, so it never crashes by iterating a non-iterable object.

### Changed

- **Dependency and build fixes**: pinned `@deepseek-ai/dsh-attachment` to the compatible `0.1.1-rc.2` track (free resolution previously picked the incompatible 0.0.x line, dragging in `dsh-brand` / `dsh-invariants` version conflicts that made `npm install` fail with ERESOLVE); added the `@deepseek-ai/dsh-client-ui-settings` and `@deepseek-ai/dsh-client-store` type packages (providing the `settings.section` slot augmentation and the `SnapshotSelectorHook` type) to clear the build-time type errors.

## [0.2.0] - 2026-09-02

### Added

- **Prompt template library**: store frequently used prompts (coding / summarizing / translating / role-play…) as templates and insert them on demand. Create / edit / delete them in Settings → BetterInput → "Prompt templates"; each template has a name, an optional description, a body, and optional comma-separated tags (used for search); the list is sorted by most recently updated. All data lives in a local file on the host machine (`~/.dsh/better-input/templates.json`) — nothing leaves your machine. Writes go through a temp file + atomic rename; a corrupted file is quarantined as `*.corrupt-<timestamp>` and rebuilt instead of breaking the plugin.
- **`/` trigger in the composer**: typing `/` pops up template candidates; keep typing to filter live by name / description / tag (up to 50 shown). Picking one replaces the `/` token with the template body in the draft, ready to edit further before sending. The list is prefetched when the input mounts, so the very first `/` already shows entries.
- **Limits**: up to 200 templates; name ≤ 60 chars, description ≤ 200, body ≤ 8,000, tags ≤ 8 (each ≤ 20 chars; trimmed, deduplicated case-insensitively on save).

## [0.1.9] - 2026-08-31

### Fixed

- **Voice start failure no longer sticks at "recording"**: when `recognition.start()` threw synchronously (e.g. microphone permission denied), the error state was set first but then unconditionally overwritten by "recording", leaving the button stuck active with a session that had in fact already ended. A synchronous failure now keeps the error state and settles normally.
- **Duplicate filenames no longer leak internal entries**: adding a file whose name already existed wrote a new conversion-panel store entry before the dedupe check, leaving an orphan entry with no UI reference on every duplicate. The dedupe check now runs first; the store is written only when the file is accepted.
- **Uppercase plain-text extensions no longer misreport "unsupported file type"**: files like `README.MD`, `NOTES.TXT` or `script.PY` previously failed to match the lowercase extension table and were misjudged as non-convertible. Extensions are now lowercased before lookup.
- **HTML conversion no longer leaks a literal " head " into the output**: the `</head>` cleanup regex substituted the capture group as replacement text, turning every `</head>` into a visible " head ". It is now replaced with whitespace.
- **Huge CSV conversion no longer crashes**: table width was computed via `Math.max(...spread)`, which overflows the call stack on six-figure row counts (RangeError). Width is now accumulated in a loop; when data rows are wider than the header, the header is padded with column names so the Markdown table stays well-formed.
- **Excel truncation now warns**: sheets beyond 5,000 rows were silently dropped. The conversion result now carries a warning: "sheet X exceeds 5,000 rows, keeping the first 5,000".
- **"No conversion needed, send directly" notice no longer shows as a red error**: the notice previously reused the error toast; it now uses the neutral info toast (consistent with the unconfigured-OCR prompt).

### Changed

- **ZIP nested-conversion entry hoisted out of the loop**: the dynamic `import('to-markdown.js')` now resolves once before the loop instead of once per entry. It remains a function-level lazy import, so the module-level cycle avoidance is untouched.

## [0.1.8] - 2026-08-29

### Fixed

- **Full dark-theme adaptation**: the plugin previously used self-invented `--dsh-color-*` variables (undefined in DSH), leaving the confirm dialog, error toasts, and the file panel white-on-white under the dark theme. Everything now uses DSH's official theme tokens (`--dsw-alias-*`), so the whole plugin UI follows light/dark automatically. Thanks to [@virggle](https://github.com/virggle) for the contribution (#2 / #3).
- **Settings dropdowns unreadable in dark theme**: a native `<select>` popup cannot be transparent and falls back to a white background, which combined with light label text in dark mode made options nearly invisible (e.g. "Reasoning Effort"). All dropdowns, inputs, and textareas in Settings now use the background token and render correctly in both themes.
- **Ctrl+A inside the optimize compare box selects only that block**: pressing Ctrl/Cmd+A within the original/optimized panes now selects just that pane's text instead of the whole page.
- **Drag-select release no longer closes the dialog**: finishing a text selection by releasing the mouse over the overlay no longer closes the dialog nor loses the selection (the same guard applies to the error toast).
- **Error text and recording dot now use theme tokens**: three previously hardcoded reds (#e5484d) — the settings error hints, the update notice, and the voice-recording dot — now follow the theme as well.

## [0.1.7] - 2026-08-27

### Fixed

- **Fix startup failure on some Node versions**: `lib/` is emitted as ESM, and `pdf.ts`'s top-level `import { getDocument } from "pdfjs-dist/legacy/build/pdf.js"` relies on Node's static analysis (cjs-module-lexer) to detect named exports from the CommonJS bundle. That detection is inconsistent across Node versions, so some environments crash on plugin load with `Named export 'getDocument' not found`. It now uses a function-level dynamic `await import()`, matching the existing pattern in `ocr.ts`, and no longer depends on named-export detection of the CJS artifact — stable on every Node version. Thanks to [@kennyxiongxy](https://github.com/kennyxiongxy) for the contribution.

## [0.1.6] - 2026-08-26

### Added

- **OCR vision recognition (scanned PDF / PPT)**: after adding a PDF or PPT and clicking "Start conversion", you're asked whether to use OCR. When chosen, PDF pages are rendered to images (or PPT `ppt/media/` embedded images are extracted) and sent one at a time to the "OCR vision model" you configure separately in Settings, producing Markdown — ideal for scanned documents, image-only PDFs, and PPTs whose slides are pictures without a text layer.
- **OCR vision model setting**: a new "OCR vision model" dropdown in Settings picks the vision model used to read scanned pages / embedded images. It is **independent of the polish model** and must be selected separately; without one, OCR is unavailable.
- **Soft prompt when no model is configured**: without an OCR model, clicking "Use OCR" shows a neutral info toast guiding you to Settings instead of a red error.
- **OCR modality guard**: before converting, the selected model's declared input modalities are checked; if it explicitly does not support image input, you're told upfront "this model does not support image input" instead of getting a confusing empty result.
- **Settings section headings**: the Settings page now groups "Voice Recognition" and "Prompt Polishing" under their own section titles.

### Fixed

- **File-size limit no longer rejects image-heavy documents by mistake**: the Host previously applied a faulty conversion (`200_000 × 8` ≈ 1.6 MB) as the input cap, so any document larger than 1.6 MB but with very little text (e.g. an image-heavy PDF / Word) was refused with "file too large to convert". This is now an independent input guard, `MAX_INPUT_BYTES` (200 MB), that only blocks files large enough to risk blowing up parse memory — byte size is no longer confused with character count.
- **pdfjs Node render warning**: fixed the "Cannot polyfill DOMMatrix/Path2D" warning that fell back to `node-canvas` during PDF rendering — the equivalents are now supplied by `@napi-rs/canvas`, and pdfjs loads only after the globals are in place.

### Changed

- **Removed the character cap on conversion output**: converted Markdown is now emitted in full, no more 200,000-character truncation (`MAX_CONVERTED_CHARACTERS` deleted). Long documents, big tables and long histories are sent into the conversation intact.
- **Upload limit adjusted**: the front-end upload cap was raised from 25 MB to 200 MB, matching the Host input guard.

## [0.1.5] - 2026-08-24

### Added

- **Choose file / file-to-Markdown**: a new "Choose file" button at the top right of the composer (collapsed by default, click to expand). Convert PDF / DOCX / XLSX / PPTX / HTML / EPUB / CSV / JSON / XML and more into clean, structured Markdown, then insert it as an `@<filename>` reference chip; on send the converted text is expanded into the message. Results can be re-edited in the dock.
- **Plain-text files send directly, no conversion**: for text formats DSH already reads natively — `.txt / .md / .py / .js / .ts / .json / .yaml / .xml / .ini / .toml / .env` — files can be sent directly without conversion, covering the "bring in a file outside the workspace" case.
- **`@` candidate lists every added file**: typing `@` shows all added files; plain-text and converted documents can be inserted right away, while unconverted binary documents are flagged "convert first".

### Changed

- **Toolbar UI**: the file feature is no longer always visible — it's now a small button at the top right of the composer that expands/collapses the conversion panel (with a non-linear animation).
- **Conversion layer**: added `src/converter/`, a pure-TypeScript file-to-Markdown layer (mammoth / turndown / papaparse / SheetJS / pdfjs / jszip / fast-xml-parser), bundled on the Host only — no added browser bundle size.
- **Skip images**: images inside Word / HTML / EPUB are no longer dumped as base64 binary — they are skipped.

## [0.1.4] - 2026-08-23

### Added

- **Prompt optimization supports conversation context**: during optimization you can reference the most recent N turns of the current conversation as context (settable in Settings via "Context turns"; 0 disables it; default is 3), so the rewrite stays in tune with the ongoing session.

### Changed

- **Removed the composer reasoning-effort slider**: during development we actually built a Codex-style slider — a custom `EffortSlider` / `ModelSelector` replacing DSH's built-in `conversation.input.model`, with drag, snap-on-release and maxed-out glow effects, plus a toggle in Settings. But turning out to be awkward in practice, **the "add a toggle in Settings" interaction** — features that modify DSH's built-in plugins and could in principle be split into standalone plugins are better enabled/disabled by install/uninstall than a toggle. So we removed the slider and restored DSH's original model picker; install the reference repo [@HanaAyane/dsh-reasoning-effort](https://github.com/HanaAyane/dsh-reasoning-effort) directly if you want that experience.
- **Prompt optimization is always on**: the settings toggle was removed and the feature stays enabled; the detailed configuration (optimize model, thinking effort, prompt, context turns) remains available.
- **README adds a note "On settings toggles"**: for features that modify DSH's built-in plugins and could in principle be split into standalone plugins, enable/disable them by installing/uninstalling — BetterInput no longer offers kill-switches for core features, and anything that can be split out already has been (or is covered by a third-party plugin).

### Docs

- **Changelog tracking starts with this version**: Chinese is authoritative; the English mirror is maintained in the same repo.

## [0.1.3] and earlier

A changelog was not kept before; the following is a summary of the major milestones reconstructed from Git history:

- **Voice input + AI polishing**: browser speech recognition transcripts, then reuse models already configured in dsh to polish the text (fillers, homophone fixes, punctuation), with settings for recognition language, recording limit, polish model, polish thinking effort and custom polish prompt.
- **One-click prompt optimization**: optimize the prompt in the input box with an LLM, shipped together with thinking-effort control; settings for optimize model, optimize thinking effort and custom optimize prompt. (Thinking-effort control was introduced here, later evolving into the slider interaction in this version before being removed.)
- **Follow the DSH language switch**: switch between Chinese/English along with the dsh UI via the locale runtime.
- **Check for updates**: the "About & Updates" section in Settings can check for new versions and shows update commands both for a globally installed dsh CLI and for the npx fallback; it also displays version, license and repository info.
- **Compatibility with DSH 0.1.0-rc.8**: unified dependency version ranges; confirmed image input is natively supported by DSH and removed the old image-plugin description.
- **Docs and release assets**: bilingual README (project banner, design references, input-enhancement roadmap) and npm version/downloads badges.

(This is a summary for 0.1.3 and earlier; see Git history for the individual changes.)
