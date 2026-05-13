# Architecture and Mentoring Workflow

## Runtime shape

This plugin has two runtime surfaces that communicate through Figma plugin messages:

1. **Controller runtime (`src/backend`)** runs in Figma's plugin sandbox. It owns Figma API calls, style loading, validation before mutation, variable lookup, font loading, and UI resize requests.
2. **UI runtime (`src/ui`)** runs in the plugin iframe. It owns table rendering, inline editing, bulk editing, variable selection, message payload validation, and resize requests back to the controller.

Generated artifacts live at the repository root:

- `code.js` is built from `src/backend/code.ts` by `scripts/build-controller.mjs`.
- `ui.html` is built from `src/ui/template.html`, Tailwind CSS, and the TypeScript UI entry point by `scripts/build-ui.mjs`.

Run `npm run build` after source changes so the checked-in Figma artifacts stay in sync.

## Source map

### Backend modules

- `src/backend/code.ts` starts the plugin UI and wires controller message routing.
- `src/backend/message-router.ts` validates and dispatches UI messages.
- `src/backend/load-styles.ts` loads local text styles, fonts, and supported variables for the UI snapshot.
- `src/backend/apply-changes.ts` applies validated edits to Figma text styles.
- `src/backend/text-style-view-model.ts` converts Figma styles into serializable UI view models.
- `src/backend/text-style-assignments.ts`, `src/backend/variable-bindings.ts`, and `src/backend/utils.ts` contain focused mutation and helper logic.
- `src/backend/message-errors.ts` and `src/backend/ui-messages.ts` define controller-facing message helpers and contracts.

### Shared modules

- `src/shared/plugin-message-types.ts` and `src/shared/plugin-message-schemas.ts` define plugin message contracts.
- `src/shared/text-style-types.ts` and `src/shared/text-style-schemas.ts` define editable text-style contracts.
- `src/shared/figma-types.ts` isolates Figma API typing helpers that are reused by backend code and tests.

### UI modules

- `src/ui/init.ts` is the UI entry point. It imports side-effect wiring modules, builds the table header, and requests the first style snapshot.
- `src/ui/app.ts` owns shared UI state, toolbar behavior, filtering, dirty tracking, apply/reload messaging, and resize messaging.
- `src/ui/table-rendering.ts` owns row and cell component builders for the style table.
- `src/ui/bulk-editor.ts` owns the multi-row bulk editing controls and variable chips.
- `src/ui/variable-picker.ts` owns the floating variable picker and registers its opener with shared UI state.
- `src/ui/message-validation.ts` validates controller-to-UI payloads before rendering.
- `src/ui/dom-utils.ts` contains small DOM helpers used by rendering modules.
- `src/ui/styles.css` and `src/ui/template.html` define the iframe shell and Tailwind styling surface.

## Message flow

1. UI entry point posts `{ type: "load-styles" }`.
2. Controller loads Figma text styles, fonts, and FLOAT variables, then posts `{ type: "styles-loaded", styles, fonts, variables }`.
3. UI validates the snapshot, renders table rows, and tracks edits locally in `edits`.
4. User actions create per-style `changes` and `varBindings` entries.
5. UI posts `{ type: "apply-changes", edits }`.
6. Controller validates every edit before mutating a style, applies changes, and returns `{ type: "apply-results", results }`.
7. UI displays failures inline, clears successful edits, and requests a canonical reload after successful applies.

## Build and test workflow

Use these checks while changing the codebase:

- `npm run typecheck` validates TypeScript sources.
- `npm run build` regenerates `code.js` and `ui.html` from source.
- `npm run test:unit` runs controller and UI module tests.
- `npm test` runs unit tests, UI smoke checks, and generated artifact drift checks.

## Mentoring workflow for future contributors

Use this sequence when pairing or onboarding someone into the project:

1. **Orient around message boundaries.** Start with `ARCHITECTURE.md`, then follow one complete `load-styles` and `apply-changes` path from UI to backend.
2. **Make source-only changes first.** Edit files under `src/`, not generated root artifacts directly.
3. **Keep modules focused.** UI rendering changes should usually land in `table-rendering.ts`, bulk controls in `bulk-editor.ts`, controller validation in backend/shared schema modules, and Figma mutations in `apply-changes.ts` or assignment helpers.
4. **Add or update the closest test.** Controller behavior belongs in `test/controller.test.mjs`; UI validation/rendering behavior belongs in `test/ui-modules.test.mjs`; live Figma behavior belongs in `MANUAL_QA.md`.
5. **Regenerate artifacts.** Run `npm run build` after code changes and inspect generated diffs only for expected output.
6. **Run the full gate.** Finish with `npm test` before review.
7. **Capture project memory.** Add durable decisions, known constraints, and follow-up reminders to `PROJECT_MEMORY.md` so future work starts with context.
