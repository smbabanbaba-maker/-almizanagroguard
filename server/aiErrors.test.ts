import { describe, expect, it } from "vitest";
import { friendlyAiError } from "./routers";

describe("friendly AI error mapping", () => {
  it("maps timeout errors to a retryable crop-health message", () => {
    expect(friendlyAiError(new Error("AI analysis timeout")).message).toContain(
      "took too long to respond"
    );
  });

  it("preserves provider configuration errors for actionable setup feedback", () => {
    const error = new Error("gemini AI provider is not configured");
    expect(friendlyAiError(error)).toBe(error);
  });

  it("maps unexpected upstream failures to a safe generic message", () => {
    expect(friendlyAiError(new Error("502 upstream failure")).message).toContain(
      "couldn't complete the AI assessment"
    );
  });
});
