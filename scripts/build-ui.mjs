import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(projectRoot, "src", "ui", "template.html");
const appEntryPath = join(projectRoot, "src", "ui", "init.ts");
const cssInputPath = join(projectRoot, "src", "ui", "styles.css");
const tempDir = join(projectRoot, ".tmp");
const cssOutputPath = join(tempDir, "ui.css");
const jsOutputPath = join(tempDir, "ui.js");
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

await esbuild.build({
  entryPoints: [appEntryPath],
  outfile: jsOutputPath,
  bundle: true,
  format: "iife",
  target: "es2017",
  minify: false,
  sourcemap: false,
});

const template = readFileSync(templatePath, "utf8");
const css = readFileSync(cssOutputPath, "utf8");
const app = readFileSync(jsOutputPath, "utf8");
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
