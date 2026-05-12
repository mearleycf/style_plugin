import type {
  FontStylesByFamily,
  SupportedVariableBindingField,
  TextStyleViewModel,
  VariableInfo,
} from "./text-style-types";

export type PendingEdit = {
  id: string;
  changes: Partial<Omit<TextStyleViewModel, "id" | "boundVars">>;
  // string = bind to this variable ID, null = unbind
  varBindings: Partial<Record<SupportedVariableBindingField, string | null>>;
};

export type ApplyResult = {
  id: string;
  name: string;
  ok: boolean;
  error?: string;
};

export type PluginMessage =
  | { type: "load-styles" }
  | { type: "apply-changes"; edits: PendingEdit[] }
  | { type: "resize"; width: number; height: number };

export type UIMessage =
  | {
      type: "styles-loaded";
      styles: TextStyleViewModel[];
      fonts: FontStylesByFamily;
      variables: VariableInfo[];
    }
  | { type: "apply-results"; results: ApplyResult[] }
  | { type: "error"; message: string };

export type ResolvedVarBinding<TVariable = unknown> = {
  field: SupportedVariableBindingField;
  variable: TVariable | null;
};
