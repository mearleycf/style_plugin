import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(projectRoot, "src", "ui", "template.html");
const appInputPaths = [
  join(projectRoot, "src", "ui", "dom-utils.js"),
  join(projectRoot, "src", "ui", "message-validation.js"),
  join(projectRoot, "src", "ui", "app.js"),
  join(projectRoot, "src", "ui", "bulk-editor.js"),
  join(projectRoot, "src", "ui", "variable-picker.js"),
  join(projectRoot, "src", "ui", "table-rendering.js"),
  join(projectRoot, "src", "ui", "init.js"),
];
const cssInputPath = join(projectRoot, "src", "ui", "styles.css");
const tempDir = join(projectRoot, ".tmp");
const cssOutputPath = join(tempDir, "ui.css");
const finalUiPath = join(projectRoot, "ui.html");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

mkdirSync(tempDir, { recursive: true });

execFileSync(
  npxCommand,
  [
    "tailwindcss",
    "-i",
    cssInputPath,
    "-o",
    cssOutputPath,
    "--minify",
  ],
  {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  },
);

const template = readFileSync(templatePath, "utf8");
const css = readFileSync(cssOutputPath, "utf8");
const app = appInputPaths.map((path) => readFileSync(path, "utf8")).join("\n");
if (!template.includes("/* STYLE_INJECT */")) {
  throw new Error("src/ui/template.html is missing /* STYLE_INJECT */");
}
if (!template.includes("<!-- SCRIPT_INJECT -->")) {
  throw new Error("src/ui/template.html is missing <!-- SCRIPT_INJECT -->");
}

writeFileSync(
  finalUiPath,
  template
    .replace("<!-- STYLE_INJECT -->", css)
    .replace("/* STYLE_INJECT */", css)
    .replace("<!-- SCRIPT_INJECT -->", app),
);
rmSync(tempDir, { recursive: true, force: true });
