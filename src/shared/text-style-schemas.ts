import { z } from "zod";
import type { TextCase, TextDecoration, LeadingTrim } from "./figma-types";
import { SUPPORTED_VARIABLE_BINDING_FIELDS } from "./text-style-types";

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

export const LetterSpacingSchema = z.object ({
  value: z.number(),
  unit: z.enum(["PIXELS", "PERCENT"])
})

export const LineHeightSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("AUTO") }),
  z.object({
    value: z.number().positive(),
    unit: z.enum(["PIXELS", "PERCENT"]),
  }),
]);

export const FontFamilySchema = z.string();

export const FontStyleSchema = z.string();

export const FontNameSchema = z.object ({
  family: FontFamilySchema,
  style: FontStyleSchema,
});

export const FontStylesByFamilySchema = z.record(
  FontFamilySchema,
  z.array(FontStyleSchema),
);

export const TextCaseSchema = z.enum(TEXT_CASE_VALUES);
export const TextDecorationSchema = z.enum(TEXT_DECORATION_VALUES);
export const LeadingTrimSchema = z.enum(LEADING_TRIM_VALUES);

export const VariableInfoSchema = z.object ({
  id: z.string(),
  name: z.string(),
  collectionName: z.string(),
})

export const SupportedVariableBindingFieldSchema = z.enum(
  SUPPORTED_VARIABLE_BINDING_FIELDS,
);

export const BoundVarsSchema = z.partialRecord(
  SupportedVariableBindingFieldSchema,
  z.string(),
);

export const TextStyleViewModelSchema = z.object ({
  id: z.string().min(1),
  name: z.string(),

  fontSize: z.number().positive(),
  fontName: FontNameSchema,
  letterSpacing: LetterSpacingSchema,
  lineHeight: LineHeightSchema,

  paragraphIndent: z.number().nonnegative(),
  paragraphSpacing: z.number().nonnegative(),

  textCase: TextCaseSchema,
  textDecoration: TextDecorationSchema,
  leadingTrim: LeadingTrimSchema,

  listSpacing: z.number().nonnegative(),
  hangingPunctuation: z.boolean(),
  hangingList: z.boolean(),

  boundVars: BoundVarsSchema,
})