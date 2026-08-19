import { afterEach, describe, expect, it, vi } from "vitest";

const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.AGROGUARD_AI_MODEL;

afterEach(() => {
  process.env.GEMINI_API_KEY = originalGeminiKey;
  process.env.AGROGUARD_AI_MODEL = originalModel;
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Gemini OpenAI-compatible authentication", () => {
  it("sends the Gemini API key as a Bearer token", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Gemini response" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({ messages: [{ role: "user", content: "Hello" }] });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer gemini-test-key",
          "content-type": "application/json",
        }),
      })
    );
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
      "x-goog-api-key"
    );
  });

  it("falls back to Gemini 2.5 Flash when Vercel still has the retired 2.0 model", async () => {
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.AGROGUARD_AI_MODEL = "gemini-2.0-flash";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "Gemini response" } }] }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({ messages: [{ role: "user", content: "Hello" }] });

    const payload = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(payload.model).toBe("gemini-2.5-flash");
  });
});
