import type { TextStyleChanges } from "../shared/text-style-types";

type TextStyleChangeField = keyof TextStyleChanges;

type TextStyleAssignment<K extends TextStyleChangeField> = {
  apply: (textStyle: TextStyle, value: NonNullable<TextStyleChanges[K]>) => void;
};

type TextStyleAssignmentMap = {
  [K in TextStyleChangeField]-?: TextStyleAssignment<K>;
};

const TEXT_STYLE_ASSIGNMENTS = {
  name: {
    apply(textStyle, value) {
      textStyle.name = value;
    },
  },
  fontSize: {
    apply(textStyle, value) {
      textStyle.fontSize = value;
    },
  },
  fontName: {
    apply(textStyle, value) {
      textStyle.fontName = value;
    },
  },
  letterSpacing: {
    apply(textStyle, value) {
      textStyle.letterSpacing = value;
    },
  },
  lineHeight: {
    apply(textStyle, value) {
      textStyle.lineHeight = value;
    },
  },
  paragraphIndent: {
    apply(textStyle, value) {
      textStyle.paragraphIndent = value;
    },
  },
  paragraphSpacing: {
    apply(textStyle, value) {
      textStyle.paragraphSpacing = value;
    },
  },
  textCase: {
    apply(textStyle, value) {
      textStyle.textCase = value;
    },
  },
  textDecoration: {
    apply(textStyle, value) {
      textStyle.textDecoration = value;
    },
  },
  leadingTrim: {
    apply(textStyle, value) {
      textStyle.leadingTrim = value;
    },
  },
  listSpacing: {
    apply(textStyle, value) {
      textStyle.listSpacing = value;
    },
  },
  hangingPunctuation: {
    apply(textStyle, value) {
      textStyle.hangingPunctuation = value;
    },
  },
  hangingList: {
    apply(textStyle, value) {
      textStyle.hangingList = value;
    },
  },
} satisfies TextStyleAssignmentMap;

const TEXT_STYLE_CHANGE_FIELDS = Object.keys(
  TEXT_STYLE_ASSIGNMENTS,
) as TextStyleChangeField[];

export function applyTextStyleChanges(
  textStyle: TextStyle,
  changes: TextStyleChanges,
): void {
  for (const field of TEXT_STYLE_CHANGE_FIELDS) {
    applyTextStyleChange(textStyle, changes, field);
  }
}

function applyTextStyleChange<K extends TextStyleChangeField>(
  textStyle: TextStyle,
  changes: TextStyleChanges,
  field: K,
): void {
  const value = changes[field];
  if (value === undefined) return;

  const assignment = TEXT_STYLE_ASSIGNMENTS[field] as TextStyleAssignment<K>;
  assignment.apply(textStyle, value as NonNullable<TextStyleChanges[K]>);
}
