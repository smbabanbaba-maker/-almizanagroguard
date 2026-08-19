import { describe, expect, it } from "vitest";

const apiKey = process.env.OPENAI_API_KEY?.trim();

describe("OpenAI server secret", () => {
  it.skipIf(!apiKey)(
    "authenticates against the lightweight models endpoint",
    async () => {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status, await response.text()).toBe(200);
    },
    20_000
  );
});
