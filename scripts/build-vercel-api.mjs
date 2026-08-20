import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const output = "api/[...path].js";
execFileSync(
  "pnpm",
  [
    "exec",
    "esbuild",
    "server/vercelHandler.ts",
    "--platform=node",
    "--bundle",
    "--format=cjs",
    `--outfile=${output}`,
  ],
  { stdio: "inherit" }
);

const bundle = readFileSync(output, "utf8").replace(/[ \t]+$/gm, "");
if (!bundle.includes("module.exports = __toCommonJS(")) {
  throw new Error("Unexpected Vercel API bundle export shape");
}
if (bundle.includes('require("jose")') || bundle.includes("require('jose')")) {
  throw new Error(
    "Vercel bundle must inline jose instead of requiring its ESM package"
  );
}
writeFileSync(
  output,
  `${bundle}\n// Vercel Node runtime: expose the Express app directly as the CommonJS handler.\nmodule.exports = module.exports.default;\n`
);
