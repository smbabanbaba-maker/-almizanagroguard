import { describe, expect, it, afterEach } from "vitest";
import { getConfidenceThresholds } from "./ai/cropAnalysis";

afterEach(() => {
  delete process.env.AGROGUARD_CONFIDENCE_HIGH;
  delete process.env.AGROGUARD_CONFIDENCE_MEDIUM;
});

describe("AgroGuard confidence thresholds", () => {
  it("uses configurable high and medium thresholds", () => {
    process.env.AGROGUARD_CONFIDENCE_HIGH = "80";
    process.env.AGROGUARD_CONFIDENCE_MEDIUM = "45";
    expect(getConfidenceThresholds()).toEqual({ high: 80, medium: 45 });
  });

  it("falls back to safe defaults for invalid configuration", () => {
    process.env.AGROGUARD_CONFIDENCE_HIGH = "40";
    process.env.AGROGUARD_CONFIDENCE_MEDIUM = "50";
    expect(getConfidenceThresholds()).toEqual({ high: 70, medium: 50 });
  });
});
