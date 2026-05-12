import { z } from "zod";
import {
  SupportedVariableBindingFieldSchema,
  TextStyleViewModelSchema,
  VariableInfoSchema,
} from "./text-style-schemas";

export const TextStyleChangesSchema = TextStyleViewModelSchema.omit({
  id: true,
  boundVars: true,
}).partial();

export const PendingEditSchema = z.object({
  id: z.string().min(1),
  changes: TextStyleChangesSchema.default({}),
  varBindings: z
    .partialRecord(SupportedVariableBindingFieldSchema, z.string().nullable())
    .default({}),
});

export const ApplyResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  ok: z.boolean(),
  error: z.string().optional(),
});

export const PluginMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("load-styles") }),
  z.object({
    type: z.literal("apply-changes"),
    edits: z.array(PendingEditSchema),
  }),
  z.object({
    type: z.literal("resize"),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
]);

export const FontStylesByFamilySchema = z.record(
  z.string(),
  z.array(z.string()),
);

export const UIMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("styles-loaded"),
    styles: z.array(TextStyleViewModelSchema),
    fonts: FontStylesByFamilySchema,
    variables: z.array(VariableInfoSchema),
  }),
  z.object({
    type: z.literal("apply-results"),
    results: z.array(ApplyResultSchema),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export const ResolvedVarBindingSchema = z.object({
  field: SupportedVariableBindingFieldSchema,
  variable: z.unknown().nullable(),
});
