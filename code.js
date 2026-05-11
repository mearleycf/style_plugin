"use strict";
/// <reference path="./node_modules/@figma/plugin-typings/index.d.ts" />
function snapshotStyle(style) {
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
    };
}
async function loadStyles() {
    try {
        const [styles, availableFonts] = await Promise.all([
            figma.getLocalTextStylesAsync(),
            figma.listAvailableFontsAsync(),
        ]);
        const snapshots = styles.map(snapshotStyle);
        const fonts = {};
        for (const font of availableFonts) {
            const { family, style } = font.fontName;
            if (!fonts[family])
                fonts[family] = [];
            fonts[family].push(style);
        }
        const msg = { type: "styles-loaded", styles: snapshots, fonts };
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
            // Load the font that will be active after this edit before touching any property.
            // Figma requires the font to be loaded even for non-fontName changes (e.g. fontSize).
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
// resizable was added after the installed typings version; cast is safe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
figma.showUI(__html__, { width: 720, height: 540, title: "Bulk Typography Style Editor", resizable: true });
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
