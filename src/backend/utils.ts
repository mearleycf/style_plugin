import type { TextCase } from "../shared/figma-types";
import type { Font } from "../shared/figma-types";
import { TextCaseSchema } from "../shared/text-style-schemas";
import type { FontStylesByFamily } from "../shared/text-style-types";

export function groupStylesByFamily(fonts: Font[]): FontStylesByFamily {
  const stylesByFamily: FontStylesByFamily = {};

  for (const font of fonts) {
    const { family, style } = font.fontName;
    stylesByFamily[family] ??= [];
    stylesByFamily[family].push(style);
  }

  return stylesByFamily;
}

export function parseTextCase(value: unknown): TextCase {
  return TextCaseSchema.parse(value);
}
