import { FontStylesByFamily } from "./types";
import type { Font } from "../shared/figma-types";

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