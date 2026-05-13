# Manual Figma Verification

The automated checks run without a live Figma runtime, so they validate controller message handling with a VM harness and UI behavior with focused jsdom/module checks. The following behaviors still require manual verification inside Figma.

## Setup

- Run `npm run build` and load the plugin from the generated `manifest.json` in Figma Desktop.
- Open DevTools for the plugin iframe so message or rendering errors are visible while testing.
- Use a copy of a real design file when testing destructive edits.

## Loading and rendering

- Load an empty file and confirm the UI opens without errors and shows `0 styles`.
- Load a file with a small text style library and confirm all columns render with expected values.
- Load a file with many local text styles and confirm scrolling, filtering, column resizing, and plugin auto-resize remain usable.
- Filter by partial style name and by slash-delimited groups from the datalist suggestions.

## Inline edits

- Edit name, font family/style, size, line height, letter spacing, paragraph spacing, paragraph indent, list spacing, case, decoration, lead trim, hanging list, and hanging punctuation.
- Confirm edited rows show the pending state dot and dirty background.
- Click **Clear edits** and confirm all pending UI changes are removed without changing Figma styles.
- Apply valid edits and confirm Figma styles update, successful rows clear dirty state, and the UI reloads canonical snapshots from Figma.
- Attempt invalid values where the UI allows typing and confirm the controller reports errors without partially mutating earlier fields.

## Bulk edits

- Select two or more rows and confirm the bulk bar appears.
- Apply a bulk font family/style edit across selected rows with the same family.
- Apply mixed numeric, unit-value, enum, and boolean bulk edits.
- Confirm non-selected rows remain unchanged.
- Clear the selection and confirm the bulk bar hides.

## Variables

- Create FLOAT variables in at least one local collection before testing variable bindings.
- Bind and unbind FLOAT variables from inline controls for font size, line height, letter spacing, paragraph spacing, and paragraph indent.
- Bind and unbind FLOAT variables from the bulk controls and confirm the chip labels update.
- Search variables by variable name and collection name in the variable picker.
- Confirm non-FLOAT variables are unavailable or rejected by Figma as expected.
- Confirm unsupported fields such as list spacing do not expose variable binding controls.

## Fonts and Figma API behavior

- Confirm font preflight behavior with fonts that are available, unavailable, or slow to load in Figma.
- Confirm failed applies leave text styles unchanged in the Figma document.
- Confirm mixed apply results preserve failed edits in the UI while successful edits reload from Figma.
- Confirm plugin window resize behavior with short and long style lists, with and without the error panel and bulk bar visible.
