import type {
  ApplyResult,
  PendingEdit,
  UIMessage,
} from "../shared/plugin-message-types";
import { applyTextStyleChanges } from "./text-style-assignments";
import {
  applyResolvedVariableBindings,
  preflightEdit,
} from "./variable-bindings";
import { postUiMessage } from "./ui-messages";

export async function applyChanges(edits: PendingEdit[]): Promise<void> {
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

      styleName = style.name;

      const resolvedVarBindings = await preflightEdit(style, edit);
      applyTextStyleChanges(style, edit.changes);
      applyResolvedVariableBindings(style, resolvedVarBindings);

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
  postUiMessage(msg);
}
