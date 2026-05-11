import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const generatedAssets = [
  {
    path: join(projectRoot, "code.js"),
    label: "code.js",
    sourceDescription: "controller TypeScript source",
  },
  {
    path: join(projectRoot, "ui.html"),
    label: "ui.html",
    sourceDescription: "UI template and Tailwind CSS source",
  },
];
const beforeBuild = new Map(
  generatedAssets.map((asset) => [asset.path, readFileSync(asset.path, "utf8")]),
);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function restoreGeneratedAssets() {
  for (const asset of generatedAssets) {
    writeFileSync(asset.path, beforeBuild.get(asset.path));
  }
}

try {
  execFileSync(npmCommand, ["run", "build"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
} catch (error) {
  restoreGeneratedAssets();
  console.error("FAIL build failed during generated asset drift check");
  if (error.stdout) console.error(error.stdout);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}

const driftedAssets = generatedAssets.filter((asset) => {
  const afterBuild = readFileSync(asset.path, "utf8");
  return afterBuild !== beforeBuild.get(asset.path);
});

if (driftedAssets.length > 0) {
  restoreGeneratedAssets();
  for (const asset of driftedAssets) {
    console.error(
      `FAIL ${asset.label} is not in sync with ${asset.sourceDescription}`,
    );
  }
  console.error("Run npm run build and commit the generated output.");
  process.exit(1);
}

for (const asset of generatedAssets) {
  console.log(`PASS ${asset.label} matches its generated build output`);
}
