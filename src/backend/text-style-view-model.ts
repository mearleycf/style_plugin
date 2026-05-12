import type {
  LetterSpacing,
  LineHeight,
  VariableBindableTextField,
} from "../shared/figma-types";
import {
  SUPPORTED_VARIABLE_BINDING_FIELDS,
  type SupportedVariableBindingField,
  type TextStyleViewModel,
} from "../shared/text-style-types";

type TextStyleViewModelSource = Omit<TextStyleViewModel, "boundVars"> & {
  boundVariables?: Partial<Record<VariableBindableTextField, { id: string }>>;
};

export function toTextStyleViewModel(
  style: TextStyleViewModelSource,
): TextStyleViewModel {
  const boundVars: Partial<Record<SupportedVariableBindingField, string>> = {};
  const rawBoundVariables = style.boundVariables;
  if (rawBoundVariables) {
    for (const field of SUPPORTED_VARIABLE_BINDING_FIELDS) {
      const alias = rawBoundVariables[field as VariableBindableTextField];
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
