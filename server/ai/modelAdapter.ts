import { invokeLLM } from "../_core/llm";

export type VisionModelResponse = { content: unknown };
export interface CropVisionModelAdapter {
  analyze(imageDataUrl: string, cropType: string): Promise<VisionModelResponse>;
}

export class BuiltInVisionModelAdapter implements CropVisionModelAdapter {
  async analyze(imageDataUrl: string, cropType: string) {
    const cropContext =
      cropType === "auto-detect"
        ? "Identify the crop from the image; do not assume a crop name."
        : `The farmer expects a ${cropType} assessment, but correct that expectation if the image shows another crop.`;
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are AgroGuard's multi-crop vision assistant for farmers. Provide a cautious preliminary assessment from only what is visible. Never claim certainty, never invent an observation, and say when the image is unclear, not a crop, or cannot identify the plant. Follow integrated pest management: prioritize monitoring, hygiene, water and nutrient checks, cultural and physical controls, and prevention. If a crop-protection treatment category may be relevant, name only the category or active-control purpose, never a brand, dose, mixing ratio, purchase instruction, or application schedule. Tell the farmer to confirm a locally registered product whose label lists the identified crop and confirmed problem, and to follow its label and local extension advice. Return only the requested JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${cropContext} Assess this plant or crop image. Return a complete farmer-readable preliminary assessment. Set plant_identified to false when the image is not a plant/crop or identity is unclear. Use health_status as Healthy, Possible issue, Uncertain, or Not a plant. Give 2–6 concise care_steps and 2–5 prevention_actions. If healthy, say no treatment is needed. If there may be a disease or pest, treatment_category must remain conditional and generic; treatment_guidance must require local label registration and an expert for uncertainty or severe symptoms.`,
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agroguard_crop_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              crop: { type: "string" },
              plant_identified: { type: "boolean" },
              plant_identity_confidence: { type: "number" },
              health_status: { type: "string" },
              possible_condition: { type: "string" },
              confidence: { type: "number" },
              severity: { type: "string" },
              visible_symptoms: {
                type: "array",
                items: { type: "string" },
              },
              recommendation: { type: "string" },
              care_steps: {
                type: "array",
                items: { type: "string" },
              },
              prevention_actions: {
                type: "array",
                items: { type: "string" },
              },
              treatment_category: { type: "string" },
              treatment_guidance: { type: "string" },
              expert_required: { type: "boolean" },
              expert_guidance: { type: "string" },
              uncertainty_reason: { type: "string" },
            },
            required: [
              "crop",
              "plant_identified",
              "plant_identity_confidence",
              "health_status",
              "possible_condition",
              "confidence",
              "severity",
              "visible_symptoms",
              "recommendation",
              "care_steps",
              "prevention_actions",
              "treatment_category",
              "treatment_guidance",
              "expert_required",
              "expert_guidance",
              "uncertainty_reason",
            ],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 1500,
    });
    return { content: response.choices?.[0]?.message?.content };
  }
}
