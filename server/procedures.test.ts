import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {}, ip: "test" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("AgroGuard procedure contracts", () => {
  it("rejects malformed crop analysis input before invoking AI", async () => {
    await expect(
      caller().cropHealth.analyze({
        imageDataUrl: "not-an-image",
        cropType: "tomato",
      })
    ).rejects.toThrow();
  });
  it("rejects empty agricultural questions", async () => {
    await expect(caller().agroguard.ask({ question: "" })).rejects.toThrow();
  });
  it("protects persisted farm overview behind authentication", async () => {
    await expect(caller().farm.overview()).rejects.toThrow();
  });
});
