/** @vitest-environment jsdom */
import { describe, expect, test, vi } from "vitest";

function installUiSkeleton() {
  document.body.innerHTML = `
    <div id="toolbar"></div>
    <button id="applyBtn"></button>
    <button id="clearBtn"></button>
    <button id="reloadBtn"></button>
    <input id="filterName" />
    <button id="clearFilterBtn" class="hidden"></button>
    <span id="selInfo"></span>
    <datalist id="nameGroupList"></datalist>
    <div id="bulkBar" class="hidden"></div>
    <select id="bb-style"></select>
    <input id="bb-family" />
    <input id="bb-size" />
    <select id="bb-lhUnit"></select>
    <input id="bb-lhVal" />
    <select id="bb-lsUnit"></select>
    <input id="bb-lsVal" />
    <select id="bb-case"></select>
    <select id="bb-deco"></select>
    <select id="bb-lt"></select>
    <input id="bb-paraSp" />
    <input id="bb-indent" />
    <input id="bb-listSp" />
    <select id="bb-hangList"></select>
    <select id="bb-hangPunct"></select>
    <button id="applyBulkBtn"></button>
    <div id="bb-var-fontSize"><span></span></div>
    <div id="bb-var-lineHeight"><span></span></div>
    <div id="bb-var-letterSpacing"><span></span></div>
    <div id="bb-var-paragraphSpacing"><span></span></div>
    <div id="bb-var-paragraphIndent"><span></span></div>
    <div id="errorPanel" class="hidden"></div>
    <table><colgroup id="colgroup"></colgroup><thead><tr id="headerRow"></tr></thead><tbody id="tableBody"></tbody></table>
    <div id="varPicker" class="hidden"></div>
    <div id="varPickerLabel"></div>
    <input id="varPickerSearch" />
    <div id="varPickerList"></div>
    <div id="varPickerClear"></div>
  `;
  globalThis.parent = { postMessage: vi.fn() };
  globalThis.CSS = globalThis.CSS || { escape: (value) => String(value).replace(/"/g, '\\"') };
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

installUiSkeleton();
const app = await import("../src/ui/app.ts");
const { buildRow } = await import("../src/ui/table-rendering.ts");
const validation = await import("../src/ui/message-validation.ts");

function makeViewModel(overrides = {}) {
  return {
    id: "style-1",
    name: "Body/Regular",
    fontSize: 16,
    fontName: { family: "Inter", style: "Regular" },
    letterSpacing: { unit: "PIXELS", value: 0 },
    lineHeight: { unit: "AUTO" },
    paragraphIndent: 0,
    paragraphSpacing: 0,
    textCase: "ORIGINAL",
    textDecoration: "NONE",
    leadingTrim: "NONE",
    listSpacing: 0,
    hangingPunctuation: false,
    hangingList: false,
    boundVars: {},
    ...overrides,
  };
}

describe("UI message validation", () => {
  test("normalizes optional text style fields and supported variable bindings", () => {
    const viewModel = validation.validateTextStyleViewModel({
      ...makeViewModel({ textCase: undefined, textDecoration: undefined, leadingTrim: undefined }),
      boundVars: { fontSize: "var-1", listSpacing: "unsupported" },
    }, 0);

    expect(viewModel.textCase).toBe("ORIGINAL");
    expect(viewModel.textDecoration).toBe("NONE");
    expect(viewModel.leadingTrim).toBe("NONE");
    expect(viewModel.boundVars).toEqual({ fontSize: "var-1" });
  });

  test("rejects malformed style payloads with a field-specific error", () => {
    expect(() => validation.validateTextStyleViewModel({ ...makeViewModel(), fontSize: "16" }, 2))
      .toThrow("styles[2].fontSize must be a number");
  });
});

describe("UI rendering modules", () => {
  test("buildHeader renders table columns from the shared column definition", () => {
    app.buildHeader();

    expect(document.querySelectorAll("#colgroup col")).toHaveLength(app.COLS.length);
    expect(document.querySelector("#selectAll")).not.toBeNull();
    expect(document.querySelector("#headerRow").textContent).toContain("Name");
  });

  test("buildRow renders editable controls and records dirty changes", () => {
    const row = buildRow(makeViewModel());
    document.getElementById("tableBody").appendChild(row);

    const nameInput = row.querySelector('input[type="text"]');
    nameInput.value = "Body/Strong";
    nameInput.dispatchEvent(new Event("change", { bubbles: true }));

    expect(row.dataset.id).toBe("style-1");
    expect(row.querySelectorAll("td")).toHaveLength(app.COLS.length);
    expect(app.edits.get("style-1").changes.name).toBe("Body/Strong");
    expect(row.classList.contains("dirty")).toBe(true);
  });
});
