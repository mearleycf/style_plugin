import type {
  FontName,
  LeadingTrim,
  TextCase,
  TextDecoration,
  TextStyle,
  VariableBindableTextField,
} from "./figma-types";

export const SUPPORTED_VARIABLE_BINDING_FIELDS = [
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "paragraphSpacing",
  "paragraphIndent",
] as const satisfies readonly VariableBindableTextField[];

export type SupportedVariableBindingField =
  (typeof SUPPORTED_VARIABLE_BINDING_FIELDS)[number];

export type FontFamily = FontName["family"];
export type FontStyle = FontName["style"];

export type FontStylesByFamily = Record<FontFamily, FontStyle[]>;

export const TEXT_CASE_VALUES = [
  "ORIGINAL",
  "UPPER",
  "LOWER",
  "TITLE",
  "SMALL_CAPS",
  "SMALL_CAPS_FORCED",
] as const satisfies readonly TextCase[];

export const TEXT_DECORATION_VALUES = [
  "NONE",
  "UNDERLINE",
  "STRIKETHROUGH",
] as const satisfies readonly TextDecoration[];

export const LEADING_TRIM_VALUES = [
  "CAP_HEIGHT",
  "NONE",
] as const satisfies readonly LeadingTrim[];

export type SupportedTextCase = TextCase;

export type TextStyleViewModel = Pick<
  TextStyle,
  | "id"
  | "name"
  | "fontSize" // bindable
  | "fontName" // bindable fontFamily, fontStyle
  | "letterSpacing" // bindable
  | "lineHeight" // bindable
  | "paragraphIndent" // bindable
  | "paragraphSpacing" // bindable
  | "textCase"
  | "textDecoration"
  | "leadingTrim"
  | "listSpacing"
  | "hangingPunctuation"
  | "hangingList"
> & {
  boundVars: Partial<Record<SupportedVariableBindingField, string>>;
}

export type VariableInfo = {
  id: string;
  name: string;
  collectionName: string;
};
