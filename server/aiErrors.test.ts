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

  it("maps oversized requests to a smaller-image message", () => {
    expect(friendlyAiError(new Error("413 payload too large")).message).toContain(
      "image is too large"
    );
  });

  it("maps rejected provider keys to a production-key message", () => {
    expect(friendlyAiError(new Error("401 Unauthorized API key")).message).toContain(
      "AI provider key"
    );
  });

  it("maps provider image-request validation failures", () => {
    expect(friendlyAiError(new Error("LLM invoke failed: 400 – invalid image input")).message).toContain(
      "rejected this image request"
    );
  });
});
