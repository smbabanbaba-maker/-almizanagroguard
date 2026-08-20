import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bundlePath = resolve(process.cwd(), "api/[...path].js");
const bundle = await import(pathToFileURL(bundlePath).href);
const handler = bundle.default;

if (typeof handler !== "function") {
  throw new Error("Vercel bundle did not expose a request handler");
}

const server = createServer(handler);
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

try {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not start Vercel bundle smoke-test server");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  if (healthResponse.status !== 200 || health.status !== "ok") {
    throw new Error("Vercel bundle health check failed");
  }

  const authResponse = await fetch(`${baseUrl}/api/trpc/auth.me`);
  const auth = await authResponse.json();
  if (authResponse.status !== 200 || auth?.result?.data?.json !== null) {
    throw new Error("Vercel bundle tRPC auth response failed");
  }

  console.log("Vercel bundle smoke test passed");
} finally {
  await new Promise(resolve => server.close(resolve));
}
