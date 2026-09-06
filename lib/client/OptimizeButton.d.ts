import type { SnapshotSelectorHook, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { ConversationSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { BetterInputRemote } from '../remote.js';
import type { SettingsFace } from './MicrophoneButton.js';
/** The framework-injected `t` seat for the BetterInput namespace. */
type Translate = TranslateNS<'better-input'>;
/**
 * Props handed to a `conversation.input.right` entry, plus the injected
 * remote and settings face. In dsh 0.1.2 the slot no longer passes an owner
 * `input`/`session`; the framework standard kit supplies `useInput` (draft),
 * `useSession` (message snapshot) and `inputActions`.
 */
export type OptimizeButtonProps = {
    readonly useInput: SnapshotSelectorHook<InputState>;
    readonly useSession: SnapshotSelectorHook<ConversationSnapshot>;
    readonly inputActions: {
        setDraft(text: string): void;
    };
    readonly remote: BetterInputRemote;
    readonly useSettings: () => SettingsFace;
    readonly t: Translate;
};
/**
 * The ✨ optimize button rendered above the composer card (in
 * `conversation.input.dock`), right-aligned. Click reads the current draft,
 * calls the Host LLM to optimize it, then shows a confirmation panel with
 * the original and optimized text. The draft is replaced only when the user
 * clicks "Adopt".
 */
export declare function OptimizeButton({ useInput, useSession, inputActions, remote, useSettings, t }: OptimizeButtonProps): import("react").JSX.Element;
export {};
