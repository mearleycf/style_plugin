import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const ui = readFileSync(join(projectRoot, "ui.html"), "utf8");

const checks = [
  {
    name: "unsupported listSpacing variable binding UI is absent",
    pass: !ui.includes('data-bulk-field="listSpacing"') && !ui.includes("bb-var-listSpacing"),
  },
  {
    name: "letterSpacing has bulk variable binding UI",
    pass: ui.includes('data-bulk-field="letterSpacing"') && ui.includes("bb-var-letterSpacing"),
  },
  {
    name: "bulk controls include hanging list and punctuation",
    pass: ui.includes('id="bb-hangList"') && ui.includes('id="bb-hangPunct"'),
  },
  {
    name: "inbound styles-loaded messages are validated",
    pass: ui.includes("function validateStylesLoadedMessage"),
  },
  {
    name: "inbound apply-results messages are validated",
    pass: ui.includes("function validateApplyResultsMessage"),
  },
  {
    name: "view model boundVars access is guarded",
    pass: ui.includes("getViewModelBoundVars"),
  },
  {
    name: "error panel rendering avoids innerHTML",
    pass: ui.includes("function renderErrorPanel") && !ui.includes("ep.innerHTML"),
  },
  {
    name: "successful apply reloads canonical view models",
    pass: ui.includes("requestCanonicalReload"),
  },
  {
    name: "dirty state is tracked through edit maps and row classes",
    pass:
      ui.includes("function markDirty") &&
      ui.includes("function isDirty") &&
      ui.includes("tr.classList.add('dirty')") &&
      ui.includes("Object.keys(e.changes).length > 0 || Object.keys(e.varBindings).length > 0"),
  },
  {
    name: "variable binding helpers support bind and explicit unbind",
    pass:
      ui.includes("function setVarBinding") &&
      ui.includes("if (!isBindableVarField(field)) return") &&
      ui.includes("setVarBinding(vpState.id, vpState.field, null)") &&
      ui.includes("bulkVarBindings[vpState.field] = null"),
  },
  {
    name: "malformed inbound messages render validation errors",
    pass:
      ui.includes("renderErrorPanel('Invalid styles-loaded message:'") &&
      ui.includes("renderErrorPanel('Invalid apply-results message:'") &&
      ui.includes("styles-loaded message must include a styles array") &&
      ui.includes("apply-results message must include a results array"),
  },
  {
    name: "numeric parsing ignores invalid number input",
    pass:
      ui.includes("const size    = parseFloat") &&
      ui.includes("if (!isNaN(size)") &&
      ui.includes("const listSp  = parseFloat") &&
      ui.includes("if (!isNaN(listSp))") &&
      ui.includes("if (!isNaN(v)) setChange(id, field, v)"),
  },
  {
    name: "line height AUTO is parsed without a numeric value",
    pass:
      ui.includes("if (lhUnit === 'AUTO'") &&
      ui.includes("setChange(id, 'lineHeight', { unit: 'AUTO' })"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
