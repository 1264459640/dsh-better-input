import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import { TYPERT_REMOTE } from './remote.js'

/**
 * Host-face invocation definitions.
 *
 * This manifest used to restate every codec that `./remote.ts` already
 * declares, and the two copies drifted: when 0.1.7 replaced the codec's
 * `schema` field with a `create()` factory the host face kept the stale shape,
 * and `as const` meant nothing type-checked it. The list below is therefore the
 * Client contribution's own descriptors — one source of truth, obtained from a
 * value already typed as `TypertRemoteContribution`, whose `descriptors` are
 * the protocol's `InvocationDescriptor[]`. Re-declaring codecs here is what
 * would let this class of drift return, so it does not.
 *
 * This is exactly the shape the 0.1.7 Typert loader re-validates at
 * registration (`validateTypertManifest` in @deepseek-ai/dsh-typert-loader:
 * every parameter and result must be a strict codec with a `create()` factory).
 * The annotation is deliberately not `as const`: literal widening is what makes
 * the compiler check these objects against the protocol instead of trusting
 * them.
 */
const invocations: readonly InvocationDescriptor[] = TYPERT_REMOTE.descriptors

export const TYPERT = {
  package: 'dsh-better-input',
  face: 'host',
  schemas: [],
  invocations,
  model: {
    services: [
      {
        description: 'Host-side dsh route discovery and transcript polishing.',
        summary: 'Voice transcript polishing service.',
        tags: [],
        jsDoc: '/** Host-side dsh route discovery and transcript polishing. */',
        key: 'BetterInputPolish',
        exportName: 'BetterInputPolishService',
        members: [
          {
            kind: 'method',
            name: 'getSettings',
            signature: 'getSettings(): Promise<BetterInputSettingsView>',
            summary: 'Read the current plugin settings.',
            jsDoc: '/** Read the current plugin settings. */'
          },
          {
            kind: 'method',
            name: 'updateSettings',
            signature: 'updateSettings(patch: BetterInputSettingsPatch, signal: AbortSignal): Promise<BetterInputSettingsView>',
            summary: 'Update plugin settings when the request has not been cancelled.',
            jsDoc: '/** Update plugin settings when the request has not been cancelled. */'
          },
          {
            kind: 'method',
            name: 'listRoutes',
            signature: 'listRoutes(): Promise<PolishRoute[]>',
            summary: 'List models already registered in dsh.',
            jsDoc: '/** List models already registered in dsh. */'
          },
          {
            kind: 'method',
            name: 'resolveModelEfforts',
            signature: 'resolveModelEfforts(provider: string, model: string): Promise<{ efforts: readonly ReasoningEffortInfo[]; defaultEffort?: string }>',
            summary: 'Resolve reasoning-effort tiers for one route (lazy).',
            jsDoc: '/** Resolve reasoning-effort tiers for one route (lazy). */'
          },
          {
            kind: 'method',
            name: 'polish',
            signature: 'polish(transcript: string, provider: string, model: string, signal: AbortSignal): Promise<string>',
            summary: 'Polish one transcript through a selected dsh route.',
            jsDoc: '/** Polish one transcript through a selected dsh route. */'
          },
          {
            kind: 'method',
            name: 'optimize',
            signature: 'optimize(text: string, provider: string, model: string, context: string, signal: AbortSignal): Promise<string>',
            summary: 'Optimize one prompt through a selected dsh route.',
            jsDoc: '/** Optimize one prompt through a selected dsh route. */'
          },
          {
            kind: 'method',
            name: 'convertFile',
            signature: 'convertFile(fileName: string, fileData: string, ocr?: boolean, signal: AbortSignal): Promise<ConvertFileResult>',
            summary: 'Convert a binary file to Markdown on the Host. With ocr=true, scanned PDF pages / PPTX images are read by the vision model.',
            jsDoc: '/** Convert a binary file to Markdown on the Host. With ocr=true, scanned PDF pages / PPTX images are read by the vision model. */'
          },
          {
            kind: 'method',
            name: 'templatesList',
            signature: 'templatesList(): Promise<TemplateListResult>',
            summary: 'List all saved prompt templates, newest first.',
            jsDoc: '/** List all saved prompt templates, newest first. */'
          },
          {
            kind: 'method',
            name: 'templatesSave',
            signature: 'templatesSave(template: TemplateInput, signal: AbortSignal): Promise<TemplateSaveResult>',
            summary: 'Create or update one prompt template on the Host filesystem.',
            jsDoc: '/** Create or update one prompt template on the Host filesystem. */'
          },
          {
            kind: 'method',
            name: 'templatesRemove',
            signature: 'templatesRemove(id: string, signal: AbortSignal): Promise<TemplateRemoveResult>',
            summary: 'Remove one prompt template by id.',
            jsDoc: '/** Remove one prompt template by id. */'
          }
        ],
        types: [
          {
            name: 'BetterInputSettingsView',
            declaration: 'export interface BetterInputSettingsView { available: boolean; writable: boolean; settings: BetterInputSettings; overridden: string[] }'
          },
          {
            name: 'BetterInputSettingsPatch',
            declaration: 'export type BetterInputSettingsPatch = Partial<BetterInputSettings>'
          },
          {
            name: 'PolishRoute',
            declaration: 'export interface ReasoningEffortInfo { id: string; name: string; description?: string } export interface PolishRoute { provider: string; providerName: string; model: string; modelName: string; reasoningEfforts: readonly ReasoningEffortInfo[]; defaultReasoningEffort?: string }'
          },
          {
            name: 'ConvertFileResult',
            declaration: "export type ConvertFileResult = { success: boolean; format: 'text' | 'pdf' | 'docx' | 'xlsx' | 'xls' | 'pptx' | 'html' | 'epub' | 'csv' | 'json' | 'xml' | 'zip'; markdown: string; warnings: readonly string[]; metadata?: { pageCount?: number; slideCount?: number; sheetCount?: number; wordCount?: number; fileCount?: number } }"
          },
          {
            name: 'BetterInputTemplate',
            declaration: 'export interface BetterInputTemplate { id: string; name: string; description: string; content: string; tags: readonly string[]; createdAt: number; updatedAt: number }'
          },
          {
            name: 'TemplateInput',
            declaration: 'export interface TemplateInput { id?: string; name: string; description?: string; content: string; tags?: readonly string[] }'
          },
          {
            name: 'TemplateListResult',
            declaration: 'export interface TemplateListResult { templates: readonly BetterInputTemplate[] }'
          },
          {
            name: 'TemplateSaveResult',
            declaration: 'export interface TemplateSaveResult { template: BetterInputTemplate }'
          },
          {
            name: 'TemplateRemoveResult',
            declaration: 'export interface TemplateRemoveResult { removed: boolean }'
          }
        ]
      }
    ],
    events: [],
    objects: []
  }
}

export default TYPERT
