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
  it("accepts fenced JSON and output-text blocks from compatible Gemini responses", () => {
    const analysis = {
      crop: "Tomato",
      possible_condition: "Leaf detail unclear",
      confidence: 20,
      severity: "Undetermined",
      recommendation: "Retake the leaf photo in daylight.",
      expert_required: true,
      expert_guidance: "Consult an expert if symptoms persist.",
      uncertainty_reason: "The leaf is not clear enough.",
    };
    expect(
      parseCropAnalysis([
        {
          type: "output_text",
          text: `\`\`\`json\n${JSON.stringify(analysis)}\n\`\`\``,
        },
      ])
    ).toMatchObject({ crop: "Tomato", confidence: 20 });
  });

  it("preserves a complete healthy multi-crop assessment", () => {
    expect(
      parseCropAnalysis(
        JSON.stringify({
          crop: "Maize",
          plant_identified: true,
          plant_identity_confidence: 94,
          health_status: "Healthy",
          possible_condition: "No visible disease or pest damage",
          confidence: 87,
          severity: "None observed",
          visible_symptoms: ["Leaves appear evenly green"],
          recommendation: "Continue normal field monitoring.",
          care_steps: ["Check the crop weekly."],
          prevention_actions: ["Keep weeds controlled."],
          treatment_category: "No treatment needed",
          treatment_guidance:
            "Do not apply a treatment when no problem is visible.",
          expert_required: false,
          expert_guidance: "Seek help if new symptoms appear.",
          uncertainty_reason: "Image shows only part of the plant.",
        })
      )
    ).toMatchObject({
      crop: "Maize",
      health_status: "Healthy",
      treatment_category: "No treatment needed",
    });
  });

  it("preserves conditional care guidance for a suspected crop problem", () => {
    expect(
      parseCropAnalysis(
        JSON.stringify({
          crop: "Cassava",
          plant_identified: true,
          plant_identity_confidence: 84,
          health_status: "Possible issue",
          possible_condition: "Possible leaf-spot symptoms",
          confidence: 61,
          severity: "Moderate",
          visible_symptoms: ["Brown spots visible on leaves"],
          recommendation: "Inspect nearby plants before treating.",
          care_steps: ["Remove badly affected leaves if practical."],
          prevention_actions: ["Avoid wetting leaves during irrigation."],
          treatment_category:
            "Locally registered crop-protection treatment, if confirmed",
          treatment_guidance:
            "Confirm the diagnosis and verify a locally registered product label before any treatment.",
          expert_required: true,
          expert_guidance: "Ask an extension officer to confirm the cause.",
          uncertainty_reason: "The image does not show the whole plant.",
        })
      )
    ).toMatchObject({
      crop: "Cassava",
      health_status: "Possible issue",
      expert_required: true,
    });
  });

  it("normalizes Gemini fractional confidence values to farmer-readable percentages", () => {
    const analysis = parseCropAnalysis(
      JSON.stringify({
        crop: "Tomato",
        plant_identified: true,
        plant_identity_confidence: 0.92,
        health_status: "Possible issue",
        possible_condition: "Possible leaf spot",
        confidence: 0.85,
        severity: "Moderate",
        visible_symptoms: ["Dark leaf spots"],
        recommendation: "Inspect nearby plants.",
        care_steps: ["Remove heavily affected leaves."],
        prevention_actions: ["Avoid wetting leaves during irrigation."],
        treatment_category: "Fungicide category if locally confirmed",
        treatment_guidance: "Confirm local registration and follow the label.",
        expert_required: false,
        expert_guidance: "Seek help if symptoms spread.",
        uncertainty_reason: "A lab check may distinguish similar leaf spots.",
      })
    );
    expect(analysis.confidence).toBe(85);
    expect(analysis.plant_identity_confidence).toBe(92);
  });

  it("handles a non-plant image with clear retake guidance", () => {
    expect(
      parseCropAnalysis(
        JSON.stringify({
          crop: "Plant not identified",
          plant_identified: false,
          plant_identity_confidence: 0,
          health_status: "Not a plant",
          possible_condition: "The image does not clearly show a crop or plant",
          confidence: 96,
          severity: "Not applicable",
          visible_symptoms: [],
          recommendation: "Take a close photo of one crop leaf or plant.",
          care_steps: ["Retake the photo in daylight."],
          prevention_actions: ["Keep the camera focused on the plant."],
          treatment_category: "No treatment recommended",
          treatment_guidance:
            "Do not apply a treatment until a crop is identified.",
          expert_required: false,
          expert_guidance: "No expert review is needed for this image alone.",
          uncertainty_reason: "No plant was visible in the photo.",
        })
      )
    ).toMatchObject({
      plant_identified: false,
      health_status: "Not a plant",
    });
  });
});
