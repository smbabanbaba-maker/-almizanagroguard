import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app";

const servers: Array<ReturnType<typeof createServer>> = [];

async function startTestServer() {
  const server = createServer(createApp());
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
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
