import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsController } from './settings-controller.js';
/** The framework-injected `t` seat for the BetterInput namespace. */
type Translate = TranslateNS<'better-input'>;
export type BetterInputPluginConfigProps = {
    readonly t: Translate;
    readonly settingsController: SettingsController;
};
/**
 * The BetterInput settings page. It owns the prompt-optimization configuration
 * only (model, thinking effort, custom prompt, context turns) and is rendered
 * inline on this bundle's own page inside the Plugins page, through the keyed
 * `plugins.bundle.config` seat (key = the bundle package name, `view: 'page'`).
 * That page draws the title, icon, and crumb itself and passes no dismissal
 * callback to slot components.
 */
export declare function BetterInputPluginConfig({ settingsController, t }: BetterInputPluginConfigProps): import("react").JSX.Element;
export {};
