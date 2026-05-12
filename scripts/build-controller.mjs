import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [join(projectRoot, "src", "backend", "code.ts")],
  outfile: join(projectRoot, "code.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2017",
  logLevel: "info",
});
