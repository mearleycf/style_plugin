# Project Memory

## Durable decisions

- UI source is TypeScript and bundled from `src/ui/init.ts` into the checked-in `ui.html` artifact.
- Backend source is TypeScript and bundled from `src/backend/code.ts` into the checked-in `code.js` artifact.
- Generated Figma artifacts are committed, but source files under `src/` remain the place to make changes.
- UI modules are split by responsibility: shared state/application wiring, table rendering, bulk editing, variable picking, validation, and DOM utilities.
- Controller tests use a VM harness because they run outside the Figma runtime.
- UI tests use jsdom for focused validation/rendering coverage outside the Figma iframe.

## Known constraints

- Automated tests cannot prove live Figma font loading, local variable binding, or plugin window behavior. Keep those checks in `MANUAL_QA.md`.
- Only FLOAT variables are exposed for style bindings in the UI.
- Successful applies trigger a canonical reload so the UI reflects Figma's final source of truth.
- Unsupported variable binding fields should be rejected before any style lookup or mutation.

## Next useful follow-ups

- Expand UI tests around bulk edits and variable picker interactions as the jsdom harness grows.
- Add more manual QA examples for large libraries and mixed success/failure apply results.
- Consider replacing `// @ts-nocheck` in UI modules with explicit UI-domain types once module boundaries settle.
