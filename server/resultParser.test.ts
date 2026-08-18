import { describe, expect, it } from "vitest";
import { contentToText, parseCropAnalysis } from "./ai/resultParser";

describe("AgroGuard result parser", () => {
  it("normalizes text blocks returned by model variants", () => {
    expect(contentToText([{ type: "text", text: '{"crop":"tomato"}' }])).toBe(
      '{"crop":"tomato"}'
    );
  });
  it("rejects incomplete or malformed structured output", () => {
    expect(() => parseCropAnalysis("not json")).toThrow("invalid analysis");
    expect(() =>
      parseCropAnalysis(JSON.stringify({ crop: "tomato", confidence: 150 }))
    ).toThrow("invalid analysis");
  });
  it("accepts a complete structured result", () => {
    expect(
      parseCropAnalysis(
        JSON.stringify({
          crop: "tomato",
          possible_condition: "Unclear",
          confidence: 42,
          severity: "Unknown",
          recommendation: "Retake a clear image.",
          expert_required: true,
          expert_guidance: "Consult an expert.",
          uncertainty_reason: "Image is unclear.",
        })
      )
    ).toMatchObject({ crop: "tomato", confidence: 42, expert_required: true });
  });
});
