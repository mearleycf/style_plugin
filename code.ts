/// <reference path="./node_modules/@figma/plugin-typings/index.d.ts" />

// Plugin controller — runs in Figma's sandbox (no DOM access)

// Fields we expose variable binding for in the UI
type NumericVarField =
  | "fontSize"
  | "lineHeight"
  | "letterSpacing"
  | "paragraphSpacing"
  | "paragraphIndent"
  | "listSpacing";

interface StyleSnapshot {
  id: string;
  name: string;
  fontSize: number;
  fontName: FontName;
  letterSpacing: LetterSpacing;
  lineHeight: LineHeight;
  paragraphIndent: number;
  paragraphSpacing: number;
  textCase: TextCase;
  textDecoration: TextDecoration;
  leadingTrim: LeadingTrim;
  listSpacing: number;
  hangingPunctuation: boolean;
  hangingList: boolean;
  boundVars: Partial<Record<NumericVarField, string>>; // field → variable ID
}

interface VariableInfo {
  id: string;
  name: string;
  collectionName: string;
}

interface PendingEdit {
  id: string;
  changes: Partial<Omit<StyleSnapshot, "id" | "boundVars">>;
  varBindings: Partial<Record<NumericVarField, string | null>>;
  // string = bind to this variable ID, null = unbind
}

interface ApplyResult {
  id: string;
  name: string;
  ok: boolean;
  error?: string;
}

interface FontMap {
  [family: string]: string[];
}

type PluginMessage =
  | { type: "load-styles" }
  | { type: "apply-changes"; edits: PendingEdit[] }
  | { type: "resize"; width: number; height: number };

type UIMessage =
  | {
      type: "styles-loaded";
      styles: StyleSnapshot[];
      fonts: FontMap;
      variables: VariableInfo[];
    }
  | { type: "apply-results"; results: ApplyResult[] }
  | { type: "error"; message: string };

const NUMERIC_VAR_FIELDS: NumericVarField[] = [
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "paragraphSpacing",
  "paragraphIndent",
  "listSpacing",
];

function snapshotStyle(style: TextStyle): StyleSnapshot {
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

    const snapshots = styles.map(snapshotStyle);

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
      styles: snapshots,
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

      // Load the font that will be active after this edit
      const fontToLoad = c.fontName ?? textStyle.fontName;
      await figma.loadFontAsync(fontToLoad);

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
      for (const [field, variableId] of Object.entries(edit.varBindings) as [
        NumericVarField,
        string | null,
      ][]) {
        if (variableId === null) {
          textStyle.setBoundVariable(field as VariableBindableTextField, null);
        } else {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) throw new Error(`Variable not found: ${variableId}`);
          textStyle.setBoundVariable(field as VariableBindableTextField, variable);
        }
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

figma.showUI(__html__, {
  width: 1440,
  height: 600,
  title: "Bulk Typography Style Editor",
});

figma.ui.onmessage = (raw: unknown) => {
  const msg = raw as PluginMessage;
  if (msg.type === "load-styles") {
    loadStyles();
  } else if (msg.type === "apply-changes") {
    applyChanges(msg.edits);
  } else if (msg.type === "resize") {
    figma.ui.resize(msg.width, msg.height);
  }
};
