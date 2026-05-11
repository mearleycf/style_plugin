# Manual Figma Verification

The automated checks run without a live Figma runtime, so they validate controller message handling with a VM harness and UI behavior with focused smoke checks. The following behaviors still require manual verification inside Figma:

- Loading an empty file and a file with many local text styles.
- Font preflight behavior with fonts that are available, unavailable, or slow to load in Figma.
- Binding and unbinding real FLOAT variables from the variable picker and bulk controls.
- Confirming non-FLOAT variables are unavailable or rejected by Figma as expected.
- Applying successful edits and confirming the UI reloads canonical snapshots from Figma.
- Confirming failed applies leave text styles unchanged in the Figma document.
- Plugin window resize behavior with short and long style lists.
