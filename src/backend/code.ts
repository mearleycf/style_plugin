/// <reference path="../../node_modules/@figma/plugin-typings/index.d.ts" />

import { formatPluginMessageError } from "./message-errors";
import { handlePluginMessage } from "./message-router";
import { postError } from "./ui-messages";
import { PluginMessageSchema } from "../shared/plugin-message-schemas";

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
