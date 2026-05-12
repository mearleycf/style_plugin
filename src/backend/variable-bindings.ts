import type {
  PendingEdit,
  ResolvedVarBinding,
} from "../shared/plugin-message-types";
import type { SupportedVariableBindingField } from "../shared/text-style-types";

export async function preflightEdit(
  textStyle: TextStyle,
  edit: PendingEdit,
): Promise<ResolvedVarBinding<Variable>[]> {
  await loadFontForEdit(textStyle, edit);
  return resolveVariableBindings(edit.varBindings);
}

async function loadFontForEdit(
  textStyle: TextStyle,
  edit: PendingEdit,
): Promise<void> {
  const fontToLoad = edit.changes.fontName ?? textStyle.fontName;
  await figma.loadFontAsync(fontToLoad);
}

async function resolveVariableBindings(
  varBindings: PendingEdit["varBindings"],
): Promise<ResolvedVarBinding<Variable>[]> {
  const resolvedVarBindings: ResolvedVarBinding<Variable>[] = [];
  for (const [field, variableId] of Object.entries(varBindings) as [
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

export function applyResolvedVariableBindings(
  textStyle: TextStyle,
  resolvedVarBindings: readonly ResolvedVarBinding<Variable>[],
): void {
  for (const binding of resolvedVarBindings) {
    textStyle.setBoundVariable(binding.field, binding.variable);
  }
}
