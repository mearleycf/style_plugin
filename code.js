"use strict";
/// <reference path="./node_modules/@figma/plugin-typings/index.d.ts" />
const NUMERIC_VAR_FIELDS = [
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "paragraphSpacing",
    "paragraphIndent",
    "listSpacing",
];
function snapshotStyle(style) {
    const boundVars = {};
    const rawBv = style.boundVariables;
    if (rawBv) {
        for (const field of NUMERIC_VAR_FIELDS) {
            const alias = rawBv[field];
            if (alias)
                boundVars[field] = alias.id;
        }
    }
    return {
        id: style.id,
        name: style.name,
        fontSize: style.fontSize,
        fontName: { family: style.fontName.family, style: style.fontName.style },
        letterSpacing: Object.assign({}, style.letterSpacing),
        lineHeight: Object.assign({}, style.lineHeight),
        paragraphIndent: style.paragraphIndent,
        paragraphSpacing: style.paragraphSpacing,
        textCase: style.textCase,
        textDecoration: style.textDecoration,
        leadingTrim: style.leadingTrim,
        listSpacing: style.listSpacing,
        hangingPunctuation: style.hangingPunctuation,
        hangingList: style.hangingList,
        boundVars,
    };
}
async function loadStyles() {
    try {
        const [styles, availableFonts, localVariables, localCollections] = await Promise.all([
            figma.getLocalTextStylesAsync(),
            figma.listAvailableFontsAsync(),
            figma.variables.getLocalVariablesAsync("FLOAT"),
            figma.variables.getLocalVariableCollectionsAsync(),
        ]);
        const snapshots = styles.map(snapshotStyle);
        const fonts = {};
        for (const font of availableFonts) {
            const { family, style } = font.fontName;
            if (!fonts[family])
                fonts[family] = [];
            fonts[family].push(style);
        }
        const collectionNames = {};
        for (const col of localCollections) {
            collectionNames[col.id] = col.name;
        }
        const variables = localVariables.map((v) => ({
            id: v.id,
            name: v.name,
            collectionName: collectionNames[v.variableCollectionId] || "",
        }));
        const msg = {
            type: "styles-loaded",
            styles: snapshots,
            fonts,
            variables,
        };
        figma.ui.postMessage(msg);
    }
    catch (err) {
        const msg = {
            type: "error",
            message: err instanceof Error ? err.message : String(err),
        };
        figma.ui.postMessage(msg);
    }
}
async function applyChanges(edits) {
    var _a;
    const results = [];
    for (const edit of edits) {
        let styleName = edit.id;
        try {
            const style = await figma.getStyleByIdAsync(edit.id);
            if (!style || style.type !== "TEXT") {
                results.push({
                    id: edit.id,
                    name: styleName,
                    ok: false,
                    error: "Style not found or is not a text style",
                });
                continue;
            }
            const textStyle = style;
            styleName = textStyle.name;
            const c = edit.changes;
            // Load the font that will be active after this edit
            const fontToLoad = (_a = c.fontName) !== null && _a !== void 0 ? _a : textStyle.fontName;
            await figma.loadFontAsync(fontToLoad);
            if (c.name !== undefined)
                textStyle.name = c.name;
            if (c.fontSize !== undefined)
                textStyle.fontSize = c.fontSize;
            if (c.fontName !== undefined)
                textStyle.fontName = c.fontName;
            if (c.letterSpacing !== undefined)
                textStyle.letterSpacing = c.letterSpacing;
            if (c.lineHeight !== undefined)
                textStyle.lineHeight = c.lineHeight;
            if (c.paragraphIndent !== undefined)
                textStyle.paragraphIndent = c.paragraphIndent;
            if (c.paragraphSpacing !== undefined)
                textStyle.paragraphSpacing = c.paragraphSpacing;
            if (c.textCase !== undefined)
                textStyle.textCase = c.textCase;
            if (c.textDecoration !== undefined)
                textStyle.textDecoration = c.textDecoration;
            if (c.leadingTrim !== undefined)
                textStyle.leadingTrim = c.leadingTrim;
            if (c.listSpacing !== undefined)
                textStyle.listSpacing = c.listSpacing;
            if (c.hangingPunctuation !== undefined)
                textStyle.hangingPunctuation = c.hangingPunctuation;
            if (c.hangingList !== undefined)
                textStyle.hangingList = c.hangingList;
            // Handle variable bindings
            for (const [field, variableId] of Object.entries(edit.varBindings)) {
                if (variableId === null) {
                    textStyle.setBoundVariable(field, null);
                }
                else {
                    const variable = await figma.variables.getVariableByIdAsync(variableId);
                    if (!variable)
                        throw new Error(`Variable not found: ${variableId}`);
                    textStyle.setBoundVariable(field, variable);
                }
            }
            results.push({ id: edit.id, name: styleName, ok: true });
        }
        catch (err) {
            results.push({
                id: edit.id,
                name: styleName,
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
    const msg = { type: "apply-results", results };
    figma.ui.postMessage(msg);
}
figma.showUI(__html__, {
    width: 1440,
    height: 600,
    title: "Bulk Typography Style Editor",
});
figma.ui.onmessage = (raw) => {
    const msg = raw;
    if (msg.type === "load-styles") {
        loadStyles();
    }
    else if (msg.type === "apply-changes") {
        applyChanges(msg.edits);
    }
    else if (msg.type === "resize") {
        figma.ui.resize(msg.width, msg.height);
    }
};
