/// <reference path="../../node_modules/@figma/plugin-typings/index.d.ts" />

import type { ZodError, ZodIssue } from "zod";
import type {
  LetterSpacing,
  LineHeight,
  VariableBindableTextField,
} from "../shared/figma-types";
import type {
  ApplyResult,
  PendingEdit,
  PluginMessage,
  ResolvedVarBinding,
  UIMessage,
} from "../shared/plugin-message-types";
import {
  SUPPORTED_VARIABLE_BINDING_FIELDS,
  type FontStylesByFamily,
  type SupportedVariableBindingField,
  type TextStyleViewModel,
  type VariableInfo,
} from "../shared/text-style-types";

import { PluginMessageSchema } from "../shared/plugin-message-schemas";

function postError(message: string): void {
  const msg: UIMessage = { type: "error", message };
  figma.ui.postMessage(msg);
}

function formatPluginMessageError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid plugin message";

  const [firstPath, editIndex, section, field, nestedField] = issue.path;

  if (firstPath === "width" || firstPath === "height") {
    if (issue.code === "invalid_type") {
      return "resize message must include numeric width and height";
    }
    if (issue.code === "too_small") {
      return "resize message width and height must be positive numbers";
    }
  }

  if (
    issue.code === "invalid_key" &&
    firstPath === "edits" &&
    typeof editIndex === "number" &&
    section === "varBindings" &&
    typeof field === "string"
  ) {
    return `Edit ${editIndex} includes unsupported variable binding field "${field}"`;
  }

  if (
    issue.code === "too_small" &&
    firstPath === "edits" &&
    typeof editIndex === "number" &&
    section === "changes" &&
    typeof field === "string"
  ) {
    return formatChangeRangeError(issue, editIndex, field, nestedField);
  }

  return "Invalid plugin message";
}

function formatChangeRangeError(
  issue: ZodIssue,
  editIndex: number,
  field: string,
  nestedField: PropertyKey | undefined,
): string {
  if (field === "lineHeight" && nestedField === "value") {
    return `Edit ${editIndex} lineHeight value must be greater than 0`;
  }

  if (issue.code === "too_small" && !issue.inclusive) {
    return `Edit ${editIndex} ${field} must be greater than 0`;
  }

  return `Edit ${editIndex} ${field} must be greater than or equal to 0`;
}

function toTextStyleViewModel(style: TextStyle): TextStyleViewModel {
  const boundVars: Partial<Record<SupportedVariableBindingField, string>> = {};
  const rawBv = style.boundVariables;
  if (rawBv) {
    for (const field of SUPPORTED_VARIABLE_BINDING_FIELDS) {
      const alias = rawBv[field as VariableBindableTextField];
      if (alias) boundVars[field] = alias.id;
    }
  }
  return {
    id: style.id,
    name: style.name,
    fontSize: style.fontSize,
    fontName: { family: style.fontName.family, style: style.fontName.style },
    letterSpacing: { ...style.letterSpacing } as LetterSpacing,
    lineHeight: { ...style.lineHeight } as LineHeight,
    paragraphIndent: style.paragraphIndent,
    paragraphSpacing: style.paragraphSpacing,
    textCase: style.textCase,
    textDecoration: style.textDecoration,
    leadingTrim: style.leadingTrim,
    listSpacing: style.listSpacing,
    hangingPunctuation: style.hangingPunctuation,
    hangingList: style.hangingList,
    boundVars,
  };
}

async function loadStyles(): Promise<void> {
  try {
    const [styles, availableFonts, localVariables, localCollections] =
      await Promise.all([
        figma.getLocalTextStylesAsync(),
        figma.listAvailableFontsAsync(),
        figma.variables.getLocalVariablesAsync("FLOAT"),
        figma.variables.getLocalVariableCollectionsAsync(),
      ]);

    const textStyleViewModels = styles.map(toTextStyleViewModel);

    const fonts: FontStylesByFamily = {};
    for (const font of availableFonts) {
      const { family, style } = font.fontName;
      if (!fonts[family]) fonts[family] = [];
      fonts[family].push(style);
    }

    const collectionNames: Record<string, string> = {};
    for (const col of localCollections) {
      collectionNames[col.id] = col.name;
    }

    const variables: VariableInfo[] = localVariables.map((v) => ({
      id: v.id,
      name: v.name,
      collectionName: collectionNames[v.variableCollectionId] || "",
    }));

    const msg: UIMessage = {
      type: "styles-loaded",
      styles: textStyleViewModels,
      fonts,
      variables,
    };
    figma.ui.postMessage(msg);
  } catch (err) {
    const msg: UIMessage = {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
    figma.ui.postMessage(msg);
  }
}

async function applyChanges(edits: PendingEdit[]): Promise<void> {
  const results: ApplyResult[] = [];

  for (const edit of edits) {
    let styleName = edit.id;
    try {
      const style = await figma.getStyleByIdAsync(edit.id);
      if (!style || style.type !== "TEXT") {
        results.push({
          id: edit.id,
          name: styleName,
          ok: false,
          error: "Style not found or is not a text style",
        });
        continue;
      }
      const textStyle = style as TextStyle;
      styleName = textStyle.name;

      const c = edit.changes;
      const resolvedVarBindings = await preflightEdit(textStyle, edit);

      if (c.name !== undefined) textStyle.name = c.name;
      if (c.fontSize !== undefined) textStyle.fontSize = c.fontSize;
      if (c.fontName !== undefined) textStyle.fontName = c.fontName;
      if (c.letterSpacing !== undefined) textStyle.letterSpacing = c.letterSpacing;
      if (c.lineHeight !== undefined) textStyle.lineHeight = c.lineHeight;
      if (c.paragraphIndent !== undefined) textStyle.paragraphIndent = c.paragraphIndent;
      if (c.paragraphSpacing !== undefined) textStyle.paragraphSpacing = c.paragraphSpacing;
      if (c.textCase !== undefined) textStyle.textCase = c.textCase;
      if (c.textDecoration !== undefined) textStyle.textDecoration = c.textDecoration;
      if (c.leadingTrim !== undefined) textStyle.leadingTrim = c.leadingTrim;
      if (c.listSpacing !== undefined) textStyle.listSpacing = c.listSpacing;
      if (c.hangingPunctuation !== undefined) textStyle.hangingPunctuation = c.hangingPunctuation;
      if (c.hangingList !== undefined) textStyle.hangingList = c.hangingList;

      // Handle variable bindings
      for (const binding of resolvedVarBindings) {
        textStyle.setBoundVariable(binding.field, binding.variable);
      }

      results.push({ id: edit.id, name: styleName, ok: true });
    } catch (err) {
      results.push({
        id: edit.id,
        name: styleName,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const msg: UIMessage = { type: "apply-results", results };
  figma.ui.postMessage(msg);
}

async function preflightEdit(
  textStyle: TextStyle,
  edit: PendingEdit,
): Promise<ResolvedVarBinding<Variable>[]> {
  const fontToLoad = edit.changes.fontName ?? textStyle.fontName;
  await figma.loadFontAsync(fontToLoad);

  const resolvedVarBindings: ResolvedVarBinding<Variable>[] = [];
  for (const [field, variableId] of Object.entries(edit.varBindings) as [
    SupportedVariableBindingField,
    string | null,
  ][]) {
    if (variableId === null) {
      resolvedVarBindings.push({ field, variable: null });
      continue;
    }

    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) throw new Error(`Variable not found: ${variableId}`);
    if (variable.resolvedType !== "FLOAT") {
      throw new Error(`Variable ${variableId} is not a FLOAT variable`);
    }
    resolvedVarBindings.push({ field, variable });
  }

  return resolvedVarBindings;
}

function handlePluginMessage(msg: PluginMessage): void {
  if (msg.type === "load-styles") {
    loadStyles();
    return;
  }

  if (msg.type === "apply-changes") {
    applyChanges(msg.edits);
    return;
  }

  figma.ui.resize(msg.width, msg.height);
}

figma.showUI(__html__, {
  width: 1440,
  height: 600,
  title: "Bulk Typography Style Editor",
});

figma.ui.onmessage = (raw: unknown) => {
  try {
    const result = PluginMessageSchema.safeParse(raw);

    if (!result.success) {
      throw new Error(formatPluginMessageError(result.error));
    }

    handlePluginMessage(result.data);
  } catch (err) {
    postError(err instanceof Error ? err.message : String(err));
  }
};
