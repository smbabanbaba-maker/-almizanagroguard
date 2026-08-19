import { afterEach, describe, expect, it, vi } from "vitest";

const original = {
  provider: process.env.AGROGUARD_AI_PROVIDER,
  openAi: process.env.OPENAI_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
};

afterEach(() => {
  process.env.AGROGUARD_AI_PROVIDER = original.provider;
  process.env.OPENAI_API_KEY = original.openAi;
  process.env.GEMINI_API_KEY = original.gemini;
  vi.resetModules();
});

describe("AI provider configuration", () => {
  it("uses Gemini even when a legacy provider variable is present", async () => {
    process.env.AGROGUARD_AI_PROVIDER = "openai";
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe("gemini");
  });

  it("uses Gemini when only a Gemini key is present", async () => {
    delete process.env.AGROGUARD_AI_PROVIDER;
    process.env.OPENAI_API_KEY = "";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe("gemini");
  });

  it("does not switch away from Gemini when an OpenAI key exists", async () => {
    process.env.OPENAI_API_KEY = "legacy-openai-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe("gemini");
  });

  it("fails clearly when the Gemini key is missing", async () => {
    process.env.GEMINI_API_KEY = "";
    const { invokeLLM } = await import("./_core/llm");

    await expect(
      invokeLLM({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow("gemini AI provider is not configured");
  });
});
