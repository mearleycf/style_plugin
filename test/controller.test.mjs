import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const controllerSource = readFileSync(join(projectRoot, "code.js"), "utf8");

function fromVm(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeTextStyle(overrides = {}) {
  const bindingCalls = [];
  const style = {
    id: "style-1",
    type: "TEXT",
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
    boundVariables: {},
    setBoundVariable(field, variable) {
      bindingCalls.push({ field, variableId: variable ? variable.id : null });
    },
    ...overrides,
  };
  return { style, bindingCalls };
}

function createHarness({ styles = [], variables = [] } = {}) {
  const postedMessages = [];
  const resizes = [];
  const loadedFonts = [];
  const styleLookups = [];
  const styleMap = new Map(styles.map((style) => [style.id, style]));
  const variableMap = new Map(variables.map((variable) => [variable.id, variable]));

  const figma = {
    ui: {
      onmessage: null,
      postMessage(message) {
        postedMessages.push(message);
      },
      resize(width, height) {
        resizes.push({ width, height });
      },
    },
    showUI() {},
    async getLocalTextStylesAsync() {
      return styles;
    },
    async listAvailableFontsAsync() {
      return [{ fontName: { family: "Inter", style: "Regular" } }];
    },
    async getStyleByIdAsync(id) {
      styleLookups.push(id);
      return styleMap.get(id) ?? null;
    },
    async loadFontAsync(fontName) {
      loadedFonts.push(fontName);
    },
    variables: {
      async getLocalVariablesAsync() {
        return variables;
      },
      async getLocalVariableCollectionsAsync() {
        return [{ id: "collection-1", name: "Typography" }];
      },
      async getVariableByIdAsync(id) {
        return variableMap.get(id) ?? null;
      },
    },
  };

  const context = vm.createContext({
    __html__: "<html></html>",
    console,
    figma,
  });
  vm.runInContext(controllerSource, context, { filename: "code.js" });

  async function send(rawMessage) {
    const start = postedMessages.length;
    figma.ui.onmessage(rawMessage);
    await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
    return postedMessages.slice(start);
  }

  return { figma, postedMessages, resizes, loadedFonts, styleLookups, send };
}

describe("controller message handling", () => {
  test("rejects unsupported listSpacing variable bindings before style lookup", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {},
          varBindings: { listSpacing: "variable-1" },
        },
      ],
    });

    expect(harness.styleLookups).toHaveLength(0);
    expect(fromVm(messages)).toEqual([
      {
        type: "error",
        message: 'Edit 0 includes unsupported variable binding field "listSpacing"',
      },
    ]);
  });

  test("rejects malformed resize messages without resizing the UI", async () => {
    const harness = createHarness();

    const messages = await harness.send({
      type: "resize",
      width: "wide",
      height: 600,
    });

    expect(harness.resizes).toHaveLength(0);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "resize message must include numeric width and height",
    });
  });

  test("rejects non-positive resize dimensions without resizing the UI", async () => {
    const harness = createHarness();

    const messages = await harness.send({
      type: "resize",
      width: 1440,
      height: 0,
    });

    expect(harness.resizes).toHaveLength(0);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "resize message width and height must be positive numbers",
    });
  });
});

describe("controller edit validation", () => {
  test("rejects invalid font size before mutating earlier style fields", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            name: "Heading/Regular",
            fontSize: 0,
          },
          varBindings: {},
        },
      ],
    });

    expect(style.name).toBe("Body/Regular");
    expect(style.fontSize).toBe(16);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "Edit 0 fontSize must be greater than 0",
    });
  });

  test("rejects negative paragraph spacing before mutating earlier style fields", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            fontSize: 24,
            paragraphSpacing: -1,
          },
          varBindings: {},
        },
      ],
    });

    expect(style.fontSize).toBe(16);
    expect(style.paragraphSpacing).toBe(0);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "Edit 0 paragraphSpacing must be greater than or equal to 0",
    });
  });

  test("rejects negative paragraph indent before mutating earlier style fields", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            fontSize: 24,
            paragraphIndent: -1,
          },
          varBindings: {},
        },
      ],
    });

    expect(style.fontSize).toBe(16);
    expect(style.paragraphIndent).toBe(0);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "Edit 0 paragraphIndent must be greater than or equal to 0",
    });
  });

  test("rejects negative list spacing before mutating earlier style fields", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            fontSize: 24,
            listSpacing: -1,
          },
          varBindings: {},
        },
      ],
    });

    expect(style.fontSize).toBe(16);
    expect(style.listSpacing).toBe(0);
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "Edit 0 listSpacing must be greater than or equal to 0",
    });
  });

  test("rejects non-positive numeric line height before mutating earlier style fields", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            fontSize: 24,
            lineHeight: { unit: "PIXELS", value: 0 },
          },
          varBindings: {},
        },
      ],
    });

    expect(style.fontSize).toBe(16);
    expect(style.lineHeight).toEqual({ unit: "AUTO" });
    expect(messages[0]).toMatchObject({
      type: "error",
      message: "Edit 0 lineHeight value must be greater than 0",
    });
  });
});

describe("controller apply preflight", () => {
  test("preflights variables before mutating text style properties", async () => {
    const { style } = makeTextStyle();
    const harness = createHarness({ styles: [style] });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: {
            name: "Heading/Regular",
            fontSize: 24,
            listSpacing: 8,
          },
          varBindings: { fontSize: "missing-variable" },
        },
      ],
    });

    expect(style.name).toBe("Body/Regular");
    expect(style.fontSize).toBe(16);
    expect(style.listSpacing).toBe(0);
    expect(messages[0].type).toBe("apply-results");
    expect(fromVm(messages[0].results)).toEqual([
      {
        id: style.id,
        name: "Body/Regular",
        ok: false,
        error: "Variable not found: missing-variable",
      },
    ]);
  });

  test("applies numeric list spacing and supported variable binding changes", async () => {
    const { style, bindingCalls } = makeTextStyle();
    const harness = createHarness({
      styles: [style],
      variables: [
        {
          id: "float-variable",
          name: "Size/Large",
          resolvedType: "FLOAT",
          variableCollectionId: "collection-1",
        },
      ],
    });

    const messages = await harness.send({
      type: "apply-changes",
      edits: [
        {
          id: style.id,
          changes: { listSpacing: 10 },
          varBindings: {
            fontSize: null,
            paragraphSpacing: "float-variable",
          },
        },
      ],
    });

    expect(style.listSpacing).toBe(10);
    expect(bindingCalls).toEqual([
      { field: "fontSize", variableId: null },
      { field: "paragraphSpacing", variableId: "float-variable" },
    ]);
    expect(messages[0].type).toBe("apply-results");
    expect(fromVm(messages[0].results)).toEqual([
      { id: style.id, name: "Body/Regular", ok: true },
    ]);
  });
});

