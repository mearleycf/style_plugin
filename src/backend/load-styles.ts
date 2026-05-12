import type { UIMessage } from "../shared/plugin-message-types";
import type { VariableInfo } from "../shared/text-style-types";
import { toTextStyleViewModel } from "./text-style-view-model";
import { groupStylesByFamily } from "./utils";
import { postError, postUiMessage } from "./ui-messages";

export async function loadStyles(): Promise<void> {
  try {
    const [styles, availableFonts, localVariables, localCollections] =
      await Promise.all([
        figma.getLocalTextStylesAsync(),
        figma.listAvailableFontsAsync(),
        figma.variables.getLocalVariablesAsync("FLOAT"),
        figma.variables.getLocalVariableCollectionsAsync(),
      ]);

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
      styles: styles.map(toTextStyleViewModel),
      fonts: groupStylesByFamily(availableFonts),
      variables,
    };
    postUiMessage(msg);
  } catch (err) {
    postError(err instanceof Error ? err.message : String(err));
  }
}
