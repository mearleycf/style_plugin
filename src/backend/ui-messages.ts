import type { UIMessage } from "../shared/plugin-message-types";

export function postUiMessage(msg: UIMessage): void {
  figma.ui.postMessage(msg);
}

export function postError(message: string): void {
  const msg: UIMessage = { type: "error", message };
  postUiMessage(msg);
}
