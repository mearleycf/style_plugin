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

export type TextStyleChanges = Partial<
  Omit<TextStyleViewModel, "id" | "boundVars">
>;

export type TextStyleAssignment<K extends keyof TextStyleChanges> = {
  apply: (textStyle: TextStyle, value: NonNullable<TextStyleChanges[K]>) => void;
};

type TextStyleAssignmentMap = {
  [K in keyof TextStyleChanges]-?: TextStyleAssignment<K>;
};

export const TEXT_STYLE_ASSIGNMENTS = {
  name: {
    apply(textStyle, value) {
      textStyle.name = value;
    },
  },
  fontSize: {
    apply(textStyle, value) {
      textStyle.fontSize = value;
    },
  },
  fontName: {
    apply(textStyle, value) {
      textStyle.fontName = value;
    },
  },
  letterSpacing: {
    apply(textStyle, value) {
      textStyle.letterSpacing = value;
    },
  },
  lineHeight: {
    apply(textStyle, value) {
      textStyle.lineHeight = value;
    },
  },
  paragraphIndent: {
    apply(textStyle, value) {
      textStyle.paragraphIndent = value;
    },
  },
  paragraphSpacing: {
    apply(textStyle, value) {
      textStyle.paragraphSpacing = value;
    },
  },
  textCase: {
    apply(textStyle, value) {
      textStyle.textCase = value;
    },
  },
  textDecoration: {
    apply(textStyle, value) {
      textStyle.textDecoration = value;
    },
  },
  leadingTrim: {
    apply(textStyle, value) {
      textStyle.leadingTrim = value;
    },
  },
  listSpacing: {
    apply(textStyle, value) {
      textStyle.listSpacing = value;
    },
  },
  hangingPunctuation: {
    apply(textStyle, value) {
      textStyle.hangingPunctuation = value;
    },
  },
  hangingList: {
    apply(textStyle, value) {
      textStyle.hangingList = value;
    },
  },
} satisfies TextStyleAssignmentMap;
