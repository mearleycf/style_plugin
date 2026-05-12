import type {
  FontName,
  TextCase,
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

type SupportedVariableBindingField = (typeof SUPPORTED_VARIABLE_BINDING_FIELDS)[number];

type FontFamily = FontName["family"];
type FontStyle = FontName["style"];

export type FontStylesByFamily = Record<FontFamily, FontStyle[]>;

export type SupportedTextCase = TextCase[];

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

type VariableInfo = {
  id: string
  name: string
  collectionName: string
}
