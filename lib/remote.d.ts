import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { BetterInputSettingsPatch, BetterInputSettingsView, ConvertFileResultWire, PolishRoute, ReasoningEffortInfo, TemplateInputWire, TemplateWire } from './remote-contract.js';
export type BetterInputRemote = ClientRemote['betterInput'];
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$betterInput {
        getSettings: () => Promise<RemoteResult<BetterInputSettingsView>>;
        updateSettings: (patch: BetterInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<BetterInputSettingsView>>;
        listRoutes: () => Promise<RemoteResult<PolishRoute[]>>;
        resolveModelEfforts: (provider: string, model: string) => Promise<RemoteResult<{
            efforts: readonly ReasoningEffortInfo[];
            defaultEffort?: string;
        }>>;
        polish: (transcript: string, provider: string, model: string, signal?: AbortSignal) => Promise<RemoteResult<string>>;
        optimize: (text: string, provider: string, model: string, context: string, signal?: AbortSignal) => Promise<RemoteResult<string>>;
        convertFile: (fileName: string, fileData: string, ocr?: boolean, signal?: AbortSignal) => Promise<RemoteResult<ConvertFileResultWire>>;
        templatesList: () => Promise<RemoteResult<{
            templates: TemplateWire[];
        }>>;
        templatesSave: (template: TemplateInputWire, signal?: AbortSignal) => Promise<RemoteResult<{
            template: TemplateWire;
        }>>;
        templatesRemove: (id: string, signal?: AbortSignal) => Promise<RemoteResult<{
            removed: boolean;
        }>>;
    }
    interface TypertRemoteMap {
        'betterInput/getSettings': () => Promise<RemoteResult<BetterInputSettingsView>>;
        'betterInput/updateSettings': (patch: BetterInputSettingsPatch, signal?: AbortSignal) => Promise<RemoteResult<BetterInputSettingsView>>;
        'betterInput/listRoutes': () => Promise<RemoteResult<PolishRoute[]>>;
        'betterInput/resolveModelEfforts': (provider: string, model: string) => Promise<RemoteResult<{
            efforts: readonly ReasoningEffortInfo[];
            defaultEffort?: string;
        }>>;
        'betterInput/polish': (transcript: string, provider: string, model: string, signal?: AbortSignal) => Promise<RemoteResult<string>>;
        'betterInput/optimize': (text: string, provider: string, model: string, context: string, signal?: AbortSignal) => Promise<RemoteResult<string>>;
        'betterInput/convertFile': (fileName: string, fileData: string, ocr?: boolean, signal?: AbortSignal) => Promise<RemoteResult<ConvertFileResultWire>>;
        'betterInput/templatesList': () => Promise<RemoteResult<{
            templates: TemplateWire[];
        }>>;
        'betterInput/templatesSave': (template: TemplateInputWire, signal?: AbortSignal) => Promise<RemoteResult<{
            template: TemplateWire;
        }>>;
        'betterInput/templatesRemove': (id: string, signal?: AbortSignal) => Promise<RemoteResult<{
            removed: boolean;
        }>>;
    }
    interface TypertRemoteNamespaceMap {
        betterInput: TypertRemoteNamespace$betterInput;
    }
}
/**
 * Client-side Remote contribution for this package. Every codec is a strict
 * codec whose schema is materialized by `create()`, which is the shape the
 * Typert Gateway and the Typert loader require in 0.1.7
 * (`TypertCodec` in @deepseek-ai/dsh-typert-protocol).
 */
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export default TYPERT_REMOTE;
