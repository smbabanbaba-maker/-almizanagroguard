import { appendFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const output = "api/[...path].js";
execFileSync(
  "pnpm",
  [
    "exec",
    "esbuild",
    "server.ts",
    "--platform=node",
    "--packages=external",
    "--bundle",
    "--format=cjs",
    `--outfile=${output}`,
  ],
  { stdio: "inherit" }
);

const bundle = readFileSync(output, "utf8");
if (!bundle.includes("module.exports = __toCommonJS(server_exports)")) {
  throw new Error("Unexpected Vercel API bundle export shape");
}
appendFileSync(
  output,
  "\n// Vercel Node runtime: expose the Express app directly as the CommonJS handler.\nmodule.exports = module.exports.default;\n"
);
