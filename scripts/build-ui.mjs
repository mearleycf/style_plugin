import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(projectRoot, "src", "ui", "template.html");
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
if (!template.includes("<!-- STYLE_INJECT -->")) {
  throw new Error("src/ui/template.html is missing <!-- STYLE_INJECT -->");
}

writeFileSync(finalUiPath, template.replace("<!-- STYLE_INJECT -->", css));
rmSync(tempDir, { recursive: true, force: true });

