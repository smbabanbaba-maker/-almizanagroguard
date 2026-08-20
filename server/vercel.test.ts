import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app";

const servers: Array<ReturnType<typeof createServer>> = [];

async function startTestServer() {
  const server = createServer(createApp());
  servers.push(server);
  await new Promise<void>(resolve =>
    server.listen(0, "127.0.0.1", () => resolve())
  );
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test server did not start");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          if (!server.listening) return resolve();
          server.close(() => resolve());
        })
    )
  );
});

describe("Vercel-compatible Express app", () => {
  it("builds a Vercel bundle that inlines ESM-only jose", () => {
    const buildSource = readFileSync(
      resolve(process.cwd(), "scripts/build-vercel-api.mjs"),
      "utf8"
    );

    expect(buildSource).not.toContain("--packages=external");
    expect(buildSource).toContain("Vercel bundle must inline jose");
  });

  it("exposes a health endpoint", async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "almizan-ai-agroguard",
    });
  });

  it("keeps the tRPC auth route mounted", async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/api/trpc/auth.me`);
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json).toBeNull();
  });
});
