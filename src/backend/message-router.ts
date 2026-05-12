import type { PluginMessage } from "../shared/plugin-message-types";
import { applyChanges } from "./apply-changes";
import { loadStyles } from "./load-styles";

export function handlePluginMessage(msg: PluginMessage): void {
  switch (msg.type) {
    case "load-styles":
      void loadStyles();
      return;
    case "apply-changes":
      void applyChanges(msg.edits);
      return;
    case "resize":
      figma.ui.resize(msg.width, msg.height);
      return;
  }
}
