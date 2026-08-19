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
  it.each(["openai", "gemini"])("recognizes %s as a configured provider", async provider => {
    process.env.AGROGUARD_AI_PROVIDER = provider;
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe(provider);
  });

  it("defaults to OpenAI when an OpenAI key is present", async () => {
    delete process.env.AGROGUARD_AI_PROVIDER;
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.GEMINI_API_KEY = "";
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe("openai");
  });

  it("defaults to Gemini when only a Gemini key is present", async () => {
    delete process.env.AGROGUARD_AI_PROVIDER;
    process.env.OPENAI_API_KEY = "";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const { getConfiguredAiProvider } = await import("./_core/env");
    expect(getConfiguredAiProvider()).toBe("gemini");
  });

  it("fails clearly when the selected provider has no key", async () => {
    process.env.AGROGUARD_AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "";
    const { invokeLLM } = await import("./_core/llm");

    await expect(
      invokeLLM({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow("openai AI provider is not configured");
  });
});
