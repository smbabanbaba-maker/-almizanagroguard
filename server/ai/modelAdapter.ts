import { invokeLLM } from "../_core/llm";

export type VisionModelResponse = { content: unknown };
export interface CropVisionModelAdapter {
  analyze(imageDataUrl: string, cropType: string): Promise<VisionModelResponse>;
}

export class BuiltInVisionModelAdapter implements CropVisionModelAdapter {
  async analyze(imageDataUrl: string, cropType: string) {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are AgroGuard's ${cropType} crop-health vision model. Provide a cautious preliminary agricultural assessment. Never claim certainty, never invent an image observation, and recommend expert help when the image is unclear or symptoms are serious. Return only the requested JSON.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Assess this ${cropType} leaf or plant image. Identify the crop, possible condition, confidence from 0 to 100, severity, practical preliminary recommendation, whether an agricultural expert is required, expert guidance, and a reason for uncertainty when confidence is not high.`,
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
              possible_condition: { type: "string" },
              confidence: { type: "number" },
              severity: { type: "string" },
              recommendation: { type: "string" },
              expert_required: { type: "boolean" },
              expert_guidance: { type: "string" },
              uncertainty_reason: { type: "string" },
            },
            required: [
              "crop",
              "possible_condition",
              "confidence",
              "severity",
              "recommendation",
              "expert_required",
              "expert_guidance",
              "uncertainty_reason",
            ],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 700,
    });
    return { content: response.choices?.[0]?.message?.content };
  }
}
