/// <reference path="../../node_modules/@figma/plugin-typings/index.d.ts" />

interface PendingEdit {
  id: string;
  changes: Partial<Omit<TextStyleViewModel, "id" | "boundVars">>;
  varBindings: Partial<Record<NumericVarField, string | null>>;
  // string = bind to this variable ID, null = unbind
}

interface ApplyResult {
  id: string;
  name: string;
  ok: boolean;
  error?: string;
}

type PluginMessage =
  | { type: "load-styles" }
  | { type: "apply-changes"; edits: PendingEdit[] }
  | { type: "resize"; width: number; height: number };

type UIMessage =
  | {
      type: "styles-loaded";
      styles: TextStyleViewModel[];
      fonts: FontMap;
      variables: VariableInfo[];
    }
  | { type: "apply-results"; results: ApplyResult[] }
  | { type: "error"; message: string };

type ResolvedVarBinding = {
  field: NumericVarField;
  variable: Variable | null;
};

function postError(message: string): void {
  const msg: UIMessage = { type: "error", message };
  figma.ui.postMessage(msg);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validatePositiveNumber(
  value: unknown,
  typeError: string,
  rangeError: string,
): number {
  if (!isFiniteNumber(value)) {
    throw new Error(typeError);
  }
  if (value <= 0) {
    throw new Error(rangeError);
  }
  return value;
}

function validateNonNegativeNumber(
  value: unknown,
  typeError: string,
  rangeError: string,
): number {
  if (!isFiniteNumber(value)) {
    throw new Error(typeError);
  }
  if (value < 0) {
    throw new Error(rangeError);
  }
  return value;
}

function isOneOf<T extends string>(
  value: unknown,
  values: readonly T[],
): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isNumericVarField(value: string): value is NumericVarField {
  return (NUMERIC_VAR_FIELDS as readonly string[]).includes(value);
}

function isFontName(value: unknown): value is FontName {
  return (
    isRecord(value) &&
    typeof value.family === "string" &&
    typeof value.style === "string"
  );
}

function isLetterSpacing(value: unknown): value is LetterSpacing {
  return (
    isRecord(value) &&
    isFiniteNumber(value.value) &&
    (value.unit === "PIXELS" || value.unit === "PERCENT")
  );
}

function isLineHeight(value: unknown): value is LineHeight {
  if (!isRecord(value)) return false;
  if (value.unit === "AUTO") return true;
  return (
    isFiniteNumber(value.value) &&
    value.value > 0 &&
    (value.unit === "PIXELS" || value.unit === "PERCENT")
  );
}

function validateStyleChanges(
  value: unknown,
  editIndex: number,
): PendingEdit["changes"] {
  if (!isRecord(value)) {
    throw new Error(`Edit ${editIndex} changes must be an object`);
  }

  const changes: PendingEdit["changes"] = {};
  for (const [field, fieldValue] of Object.entries(value)) {
    switch (field) {
      case "name":
        if (typeof fieldValue !== "string") {
          throw new Error(`Edit ${editIndex} name must be a string`);
        }
        changes.name = fieldValue;
        break;
      case "fontSize":
        changes.fontSize = validatePositiveNumber(
          fieldValue,
          `Edit ${editIndex} fontSize must be a number`,
          `Edit ${editIndex} fontSize must be greater than 0`,
        );
        break;
      case "fontName":
        if (!isFontName(fieldValue)) {
          throw new Error(`Edit ${editIndex} fontName must include family and style`);
        }
        changes.fontName = fieldValue;
        break;
      case "letterSpacing":
        if (!isLetterSpacing(fieldValue)) {
          throw new Error(`Edit ${editIndex} letterSpacing is invalid`);
        }
        changes.letterSpacing = fieldValue;
        break;
      case "lineHeight":
        if (!isLineHeight(fieldValue)) {
          if (
            isRecord(fieldValue) &&
            (fieldValue.unit === "PIXELS" || fieldValue.unit === "PERCENT") &&
            isFiniteNumber(fieldValue.value) &&
            fieldValue.value <= 0
          ) {
            throw new Error(`Edit ${editIndex} lineHeight value must be greater than 0`);
          }
          throw new Error(`Edit ${editIndex} lineHeight is invalid`);
        }
        changes.lineHeight = fieldValue;
        break;
      case "paragraphIndent":
        changes.paragraphIndent = validateNonNegativeNumber(
          fieldValue,
          `Edit ${editIndex} paragraphIndent must be a number`,
          `Edit ${editIndex} paragraphIndent must be greater than or equal to 0`,
        );
        break;
      case "paragraphSpacing":
        changes.paragraphSpacing = validateNonNegativeNumber(
          fieldValue,
          `Edit ${editIndex} paragraphSpacing must be a number`,
          `Edit ${editIndex} paragraphSpacing must be greater than or equal to 0`,
        );
        break;
      case "textCase":
        if (!isOneOf(fieldValue, TEXT_CASE_VALUES)) {
          throw new Error(`Edit ${editIndex} textCase is invalid`);
        }
        changes.textCase = fieldValue;
        break;
      case "textDecoration":
        if (!isOneOf(fieldValue, TEXT_DECORATION_VALUES)) {
          throw new Error(`Edit ${editIndex} textDecoration is invalid`);
        }
        changes.textDecoration = fieldValue;
        break;
      case "leadingTrim":
        if (!isOneOf(fieldValue, LEADING_TRIM_VALUES)) {
          throw new Error(`Edit ${editIndex} leadingTrim is invalid`);
        }
        changes.leadingTrim = fieldValue;
        break;
      case "listSpacing":
        changes.listSpacing = validateNonNegativeNumber(
          fieldValue,
          `Edit ${editIndex} listSpacing must be a number`,
          `Edit ${editIndex} listSpacing must be greater than or equal to 0`,
        );
        break;
      case "hangingPunctuation":
        if (typeof fieldValue !== "boolean") {
          throw new Error(`Edit ${editIndex} hangingPunctuation must be a boolean`);
        }
        changes.hangingPunctuation = fieldValue;
        break;
      case "hangingList":
        if (typeof fieldValue !== "boolean") {
          throw new Error(`Edit ${editIndex} hangingList must be a boolean`);
        }
        changes.hangingList = fieldValue;
        break;
      default:
        throw new Error(`Edit ${editIndex} includes unsupported change field "${field}"`);
    }
  }

  return changes;
}

function validateVarBindings(
  value: unknown,
  editIndex: number,
): PendingEdit["varBindings"] {
  if (!isRecord(value)) {
    throw new Error(`Edit ${editIndex} varBindings must be an object`);
  }

  const varBindings: PendingEdit["varBindings"] = {};
  for (const [field, variableId] of Object.entries(value)) {
    if (!isNumericVarField(field)) {
      throw new Error(
        `Edit ${editIndex} includes unsupported variable binding field "${field}"`,
      );
    }
    if (variableId !== null && typeof variableId !== "string") {
      throw new Error(`Edit ${editIndex} variable binding for ${field} is invalid`);
    }
    varBindings[field] = variableId;
  }

  return varBindings;
}

function validatePendingEdit(value: unknown, editIndex: number): PendingEdit {
  if (!isRecord(value)) {
    throw new Error(`Edit ${editIndex} must be an object`);
  }
  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Edit ${editIndex} id must be a non-empty string`);
  }

  return {
    id: value.id,
    changes: validateStyleChanges(value.changes ?? {}, editIndex),
    varBindings: validateVarBindings(value.varBindings ?? {}, editIndex),
  };
}

function validatePluginMessage(raw: unknown): PluginMessage {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    throw new Error("Plugin message must include a type");
  }

  if (raw.type === "load-styles") {
    return { type: "load-styles" };
  }

  if (raw.type === "apply-changes") {
    if (!Array.isArray(raw.edits)) {
      throw new Error("apply-changes message must include an edits array");
    }
    return {
      type: "apply-changes",
      edits: raw.edits.map(validatePendingEdit),
    };
  }

  if (raw.type === "resize") {
    if (!isFiniteNumber(raw.width) || !isFiniteNumber(raw.height)) {
      throw new Error("resize message must include numeric width and height");
    }
    if (raw.width <= 0 || raw.height <= 0) {
      throw new Error("resize message width and height must be positive numbers");
    }
    return { type: "resize", width: raw.width, height: raw.height };
  }

  throw new Error(`Unsupported plugin message type "${raw.type}"`);
}

function toTextStyleViewModel(style: TextStyle): TextStyleViewModel {
  const boundVars: Partial<Record<NumericVarField, string>> = {};
  const rawBv = style.boundVariables;
  if (rawBv) {
    for (const field of NUMERIC_VAR_FIELDS) {
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

    const fonts: FontMap = {};
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
): Promise<ResolvedVarBinding[]> {
  const fontToLoad = edit.changes.fontName ?? textStyle.fontName;
  await figma.loadFontAsync(fontToLoad);

  const resolvedVarBindings: ResolvedVarBinding[] = [];
  for (const [field, variableId] of Object.entries(edit.varBindings) as [
    NumericVarField,
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

figma.showUI(__html__, {
  width: 1440,
  height: 600,
  title: "Bulk Typography Style Editor",
});

figma.ui.onmessage = (raw: unknown) => {
  try {
    const msg = validatePluginMessage(raw);
    if (msg.type === "load-styles") {
      loadStyles();
    } else if (msg.type === "apply-changes") {
      applyChanges(msg.edits);
    } else if (msg.type === "resize") {
      figma.ui.resize(msg.width, msg.height);
    }
  } catch (err) {
    postError(err instanceof Error ? err.message : String(err));
  }
};
