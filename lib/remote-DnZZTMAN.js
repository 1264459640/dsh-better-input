import { z } from "zod";
//#region src/remote-contract.ts
const textSchema = z.string();
const booleanSchema = z.boolean().optional();
const betterInputSettingsSchema = z.object({
	language: z.string(),
	maxRecordingSeconds: z.number(),
	polishingEnabled: z.boolean(),
	polishProvider: z.string(),
	polishModel: z.string(),
	polishReasoningEffort: z.string(),
	polishPrompt: z.string(),
	optimizeEnabled: z.boolean(),
	optimizeProvider: z.string(),
	optimizeModel: z.string(),
	optimizeReasoningEffort: z.string(),
	optimizePrompt: z.string(),
	contextTurns: z.number(),
	ocrProvider: z.string(),
	ocrModel: z.string()
});
const betterInputSettingsPatchSchema = z.object({
	language: z.string().optional(),
	maxRecordingSeconds: z.number().optional(),
	polishingEnabled: z.boolean().optional(),
	polishProvider: z.string().optional(),
	polishModel: z.string().optional(),
	polishReasoningEffort: z.string().optional(),
	polishPrompt: z.string().optional(),
	optimizeEnabled: z.boolean().optional(),
	optimizeProvider: z.string().optional(),
	optimizeModel: z.string().optional(),
	optimizeReasoningEffort: z.string().optional(),
	optimizePrompt: z.string().optional(),
	contextTurns: z.number().optional(),
	ocrProvider: z.string().optional(),
	ocrModel: z.string().optional()
});
const betterInputSettingsViewSchema = z.object({
	available: z.boolean(),
	writable: z.boolean(),
	settings: betterInputSettingsSchema,
	overridden: z.array(z.string()),
	defaultPolishPrompt: z.string(),
	defaultOptimizePrompt: z.string()
});
const reasoningEffortSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional()
});
const resolveModelEffortsResultSchema = z.object({
	efforts: z.array(reasoningEffortSchema),
	defaultEffort: z.string().optional()
});
const polishRouteSchema = z.object({
	provider: z.string(),
	providerName: z.string(),
	model: z.string(),
	modelName: z.string(),
	reasoningEfforts: z.array(reasoningEffortSchema),
	defaultReasoningEffort: z.string().optional()
});
const listRoutesResultSchema = z.array(polishRouteSchema);
const polishResultSchema = z.string();
const optimizeResultSchema = z.string();
const templateSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	content: z.string(),
	tags: z.array(z.string()),
	createdAt: z.number(),
	updatedAt: z.number()
});
const templateInputSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	content: z.string(),
	tags: z.array(z.string()).optional()
});
const templateListResultSchema = z.object({ templates: z.array(templateSchema) });
const templateSaveResultSchema = z.object({ template: templateSchema });
const templateRemoveResultSchema = z.object({ removed: z.boolean() });
/** Supported file formats the converter can produce Markdown for. */
const convertibleFormatSchema = z.enum([
	"text",
	"pdf",
	"docx",
	"xlsx",
	"xls",
	"pptx",
	"html",
	"epub",
	"csv",
	"json",
	"xml",
	"zip"
]);
const convertMetadataSchema = z.object({
	pageCount: z.number().optional(),
	slideCount: z.number().optional(),
	sheetCount: z.number().optional(),
	wordCount: z.number().optional(),
	fileCount: z.number().optional()
});
const convertFileResultSchema = z.object({
	success: z.boolean(),
	format: convertibleFormatSchema,
	markdown: z.string(),
	warnings: z.array(z.string()),
	metadata: convertMetadataSchema.optional()
});
//#endregion
//#region src/remote.ts
/**
* Client-side Remote contribution for this package. Every codec is a strict
* codec whose schema is materialized by `create()`, which is the shape the
* Typert Gateway and the Typert loader require in 0.1.7
* (`TypertCodec` in @deepseek-ai/dsh-typert-protocol).
*/
const TYPERT_REMOTE = {
	package: "dsh-better-input",
	descriptors: [
		{
			id: "dsh-better-input#betterInput/getSettings",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "getSettings",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#BetterInputSettingsView",
				create: () => betterInputSettingsViewSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/updateSettings",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "updateSettings",
			invocation: { kind: "direct" },
			parameters: [{
				name: "patch",
				wire: "patch",
				source: "json",
				codec: {
					mode: "strict",
					typeSymbol: "dsh-better-input#BetterInputSettingsPatch",
					create: () => betterInputSettingsPatchSchema
				}
			}],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#BetterInputSettingsView",
				create: () => betterInputSettingsViewSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/listRoutes",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "listRoutes",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#PolishRoute[]",
				create: () => listRoutesResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/resolveModelEfforts",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "resolveModelEfforts",
			invocation: { kind: "direct" },
			parameters: [{
				name: "provider",
				wire: "provider",
				source: "json",
				codec: {
					mode: "strict",
					typeSymbol: "string",
					create: () => textSchema
				}
			}, {
				name: "model",
				wire: "model",
				source: "json",
				codec: {
					mode: "strict",
					typeSymbol: "string",
					create: () => textSchema
				}
			}],
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#ResolveModelEffortsResult",
				create: () => resolveModelEffortsResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/polish",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "polish",
			invocation: { kind: "direct" },
			parameters: [
				{
					name: "transcript",
					wire: "transcript",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "provider",
					wire: "provider",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "model",
					wire: "model",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				}
			],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "string",
				create: () => polishResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/optimize",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "optimize",
			invocation: { kind: "direct" },
			parameters: [
				{
					name: "text",
					wire: "text",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "provider",
					wire: "provider",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "model",
					wire: "model",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "context",
					wire: "context",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				}
			],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "string",
				create: () => optimizeResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/convertFile",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "convertFile",
			invocation: { kind: "direct" },
			parameters: [
				{
					name: "fileName",
					wire: "fileName",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "fileData",
					wire: "fileData",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "string",
						create: () => textSchema
					}
				},
				{
					name: "ocr",
					wire: "ocr",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "boolean",
						create: () => booleanSchema
					}
				}
			],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#ConvertFileResult",
				create: () => convertFileResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/templatesList",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "templatesList",
			invocation: { kind: "direct" },
			parameters: [],
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#TemplateListResult",
				create: () => templateListResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/templatesSave",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "templatesSave",
			invocation: { kind: "direct" },
			parameters: [{
				name: "template",
				wire: "template",
				source: "json",
				codec: {
					mode: "strict",
					typeSymbol: "dsh-better-input#TemplateInput",
					create: () => templateInputSchema
				}
			}],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#TemplateSaveResult",
				create: () => templateSaveResultSchema
			}
		},
		{
			id: "dsh-better-input#betterInput/templatesRemove",
			service: "BetterInputPolish",
			namespace: "betterInput",
			method: "templatesRemove",
			invocation: { kind: "direct" },
			parameters: [{
				name: "id",
				wire: "id",
				source: "json",
				codec: {
					mode: "strict",
					typeSymbol: "string",
					create: () => textSchema
				}
			}],
			cancellation: { parameter: "signal" },
			result: {
				mode: "strict",
				typeSymbol: "dsh-better-input#TemplateRemoveResult",
				create: () => templateRemoveResultSchema
			}
		}
	]
};
//#endregion
export { TYPERT_REMOTE as t };

//# sourceMappingURL=remote-DnZZTMAN.js.map