import type { Variable, PluginAPI, VariablesAPI } from "@figma/plugin-typings/plugin-api-standalone";

export type {
  Font,
  FontName,
  LetterSpacing,
  LineHeight,
  LeadingTrim,
  TextCase,
  TextDecoration,
  TextStyle,
  Variable,
  VariableBindableTextField,
  BaseStyle,
  StyleChange,
  DocumentChange,
  NodeChangeProperty,
  NodeChangeEvent,
  NodeChange,
  StyleChangeProperty,
} from "@figma/plugin-typings/plugin-api-standalone";

/**
 * type BaseStyle = PaintStyle | TextStyle | EffectStyle | GridStyle
 * 
 * interface BaseStyleMixin extends PublishableMixin, PluginDataMixin {
 *   the unique identifier of the style in the document the plugin is executing from. You can assign the value via `setFillStyleIdAsync`, `setStrokeStyleIdAsync`, `setTextStyleIdAsync`, etc. to make the node properties reflect that of the style node.
 * 
 *   readonly id: string
 *   readonly type: StyleType // PAINT | TEXT | EFFECT | GRID
 *   getStyleConsumersAsync(): Promise<StyleConsumers[]>
 *   readonly consumers: StyleConsumers[]
 *   name: string
 *   remove(): void
 * }
 * 
 * interface TextStyle extends BaseStyleMixin {
 *   type: 'TEXT'
 *   fontSize: number
 *   textDecoration: TextDecoration // "NONE" | "UNDERLINE" | "STRIKETHROUGH"
 *   fontName: FontName (readonly family: string, readonly style: string)
 *   letterSpacing: LetterSpacing (readonly value: number, readonly unit: 'PIXELS' | 'PERCENT')
 *   lineHeight: LineHeight ({ readonly value: number, readonly unit: 'PIXELS' | 'PERCENT' } | { readonly unit: 'AUTO' })
 *   leadingTrim: LeadingTrim ( "NONE" | "CAP_HEIGHT" )
 *   paragraphIndent: number
 *   paragraphSpacing: number
 *   listSpacing: number
 *   hangingPunctuation: boolean
 *   hangingList: boolean
 *   textCase: TextCase ( "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" | "SMALL_CAPS" | "SMALL_CAPS_FORCED" )
 *   boundVariables?: {
 *      [field in VariableBindableTextField]?: VariableAlias
 *       // VariableAlias = { type: 'VARIABLE_ALIAS', id: string }
 *       // VariableBindableTextField = ( "fontFamily" | "fontSize" | "fontStyle" | "fontWeight" | "letterSpacing" | "lineHeight" | "paragraphSpacing" | "paragraphIndent" )
 *   }
 *   setBoundVariable(field: VariableBindableTextField, variable: Variable | null): void
 *     // VariableBindableTextField = ( "fontFamily" | "fontSize" | "fontStyle" | "fontWeight" | "letterSpacing" | "lineHeight" | "paragraphSpacing" | "paragraphIndent" )
 *     // Variable = interface Variable extends PluginDataMixin {
 *       readonly id: string
 *       name: string
 *       description: string
 *       hiddenFromPublishing: boolean
 *       getPublishStatusAsync(): Promise<PublishStatus>
 *       // PublishStatus = "UNPUBLISHED" | "CURRENT" | "CHANGED"
 *       readonly remote: boolean
 *       readonly variableCollectionId: string
 *       readonly key: string
 *       readonly resolvedType: VariableResolvedDataType
 *       // VariableResolvedDataType = "BOOLEAN" | "COLOR" | "FLOAT" | "STRING"
 *       resolveForConsumer(consumer: SceneNode): { value: VariableValue, resolvedType: VariableResolvedDataType }
 *       // VariableValue = string | number | boolean | RGB | RGBA | VariableAlias
 *       setValueForMode(modeId: string, newValue: VariableValue): void
 *       readonly valuesByMode: { [modeId: string]: VariableValue }
 *       remove(): void
 *       scopes: Array<VariableScope>
 *       // VariableScope = "ALL_SCOPES" | "TEXT_CONTENT" | "CORNER_RADIUS" | "WIDTH_HEIGHT" | "GAP" | "ALL_FILLS" | "FRAME_FILL" | "SHAPE_FILL" | "TEXT_FILL" | "STROKE_COLOR" | "
 *       // STROKE_FLOAT" | "EFFECT_FLOAT" | "EFFECT_COLOR" | "OPACITY" | "FONT_FAMILY" | "FONT_STYLE" | "FONT_WEIGHT" | "FONT_SIZE" | "LINE_HEIGHT" | "LETTER_SPACING" | 
 *       // "PARAGRAPH_SPACING" | "PARAGRAPH_INDENT"
 *       readonly codeSyntax: {
 *        [platform in CodeSyntaxPlatform]?: string
 *          // CodeSyntaxPlatform = "WEB" | "ANDROID" | "iOS"
 *      }
 *       setVariableCodeSyntax(platform: CodeSyntaxPlatform, value: string): void
 *       removeVariableCodeSyntax(platform: CodeSyntaxPlatform): void
 *       valuesByModeForCollectionAsync(collection: VariableCollection): Promise<{[modeId: string]: VariableValue}>
 *       removeOverrideForMode(extendedModeId: string): void
 *   }
 *   // VariableCollection = interface VariableCollection extends PluginDataMixin {
 *        readonly id: string
 *        name: string
 *        hiddenFromPublishing: boolean
 *        getPublishStatusAsync(): Promise<PublishStatus>
 *        readonly remote: boolean
 *        readonly isExtension: boolean
 *        readonly modes: Array<{modeId: string, name: string}>
 *        readonly variableIds: string[]
 *        readonly defaultModeId: string
 *        readonly key: string
 *        extend(name: string): ExtendedVariableCollection
 *        remove(): void
 *        removeMode(modeId: string): void
 *        addMode(name: string): string
 *        renameMode(modeId: string, newName: string): void
 *   }
 *    // interface PluginDataMixin {
 *      getPluginData(key: string): string
 *      setPluginData(key: string, value: string): void
 *      getPluginDataKeys(): string[]
 *      getSharedPluginData(namespace: string, key: string): string
 *      setSharedPluginData(namespace: string, key: string, value: string): void
 *      getSharedPluginDataKeys(namespace: string): string[]
 *   }
 * }
 */

// ---- dependency injection -- functions typed from API -------------------------------

type GetVariableByIdAsync = VariablesAPI["getVariableByIdAsync"];

/**
 * Resolves a Figma variable by ID using the provided lookup function.
 *
 * Accepts the lookup function as a dependency so callers can use the live
 * Figma API in production and a controlled substitute in tests.
 *
 * @param variableId - The Figma variable ID to resolve.
 * @param getVariableByIdAsync - Function that looks up a variable by ID.
 * @returns The matching variable, or `null` when no variable exists for the ID.
 * 
 * usage:
 * await resolveVariable(variableId, (id) =>
 *   figma.variables.getVariableByIdAsync(id),
 * );
 */
async function resolveVariable(
  variableId: string,
  getVariableByIdAsync: GetVariableByIdAsync,
): Promise<Variable | null> {
  return getVariableByIdAsync(variableId);
}
