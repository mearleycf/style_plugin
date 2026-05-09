// Plugin controller — runs in Figma's sandbox (no DOM access)

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
}

interface PendingEdit {
  id: string;
  changes: Partial<Omit<StyleSnapshot, "id">>;
}

interface ApplyResult {
  id: string;
  name: string;
  ok: boolean;
  error?: string;
}

type PluginMessage =
  | { type: "load-styles" }
  | { type: "apply-changes"; edits: PendingEdit[] };

type UIMessage =
  | { type: "styles-loaded"; styles: StyleSnapshot[] }
  | { type: "apply-results"; results: ApplyResult[] }
  | { type: "error"; message: string };

function snapshotStyle(style: TextStyle): StyleSnapshot {
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
  };
}

async function loadStyles(): Promise<void> {
  try {
    const styles = await figma.getLocalTextStylesAsync();
    const snapshots: StyleSnapshot[] = styles.map(snapshotStyle);
    const msg: UIMessage = { type: "styles-loaded", styles: snapshots };
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

      if (c.name !== undefined) textStyle.name = c.name;
      if (c.fontSize !== undefined) textStyle.fontSize = c.fontSize;
      if (c.fontName !== undefined) textStyle.fontName = c.fontName;
      if (c.letterSpacing !== undefined)
        textStyle.letterSpacing = c.letterSpacing;
      if (c.lineHeight !== undefined) textStyle.lineHeight = c.lineHeight;
      if (c.paragraphIndent !== undefined)
        textStyle.paragraphIndent = c.paragraphIndent;
      if (c.paragraphSpacing !== undefined)
        textStyle.paragraphSpacing = c.paragraphSpacing;
      if (c.textCase !== undefined) textStyle.textCase = c.textCase;
      if (c.textDecoration !== undefined)
        textStyle.textDecoration = c.textDecoration;

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

figma.showUI(__html__, { width: 720, height: 540, title: "Bulk Typography Style Editor" });

figma.ui.onmessage = (raw: unknown) => {
  const msg = raw as PluginMessage;
  if (msg.type === "load-styles") {
    loadStyles();
  } else if (msg.type === "apply-changes") {
    applyChanges(msg.edits);
  }
};
