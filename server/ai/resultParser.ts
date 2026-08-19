import { z } from "zod";

export const cropAnalysisSchema = z.object({
  crop: z.string().min(1).max(80),
  plant_identified: z.boolean().optional().default(true),
  plant_identity_confidence: z.number().min(0).max(100).optional().default(0),
  health_status: z.string().min(1).max(80).optional().default("Uncertain"),
  possible_condition: z.string().min(1).max(255),
  confidence: z.number().min(0).max(100),
  severity: z.string().min(1).max(80),
  visible_symptoms: z
    .array(z.string().min(1).max(300))
    .max(8)
    .optional()
    .default([]),
  recommendation: z.string().min(1).max(4000),
  care_steps: z.array(z.string().min(1).max(700)).max(8).optional().default([]),
  prevention_actions: z
    .array(z.string().min(1).max(700))
    .max(8)
    .optional()
    .default([]),
  treatment_category: z
    .string()
    .min(1)
    .max(300)
    .optional()
    .default("No treatment recommendation yet"),
  treatment_guidance: z
    .string()
    .min(1)
    .max(1500)
    .optional()
    .default(
      "Confirm the crop and problem with a local agricultural extension professional before selecting any treatment."
    ),
  expert_required: z.boolean(),
  expert_guidance: z
    .string()
    .max(2000)
    .optional()
    .default(
      "Consult a qualified agricultural expert if symptoms spread, the crop declines quickly, or the result is unclear."
    ),
  uncertainty_reason: z.string().max(1000).optional().default(""),
});
export type CropAnalysis = z.infer<typeof cropAnalysisSchema>;

export function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((part: any) => {
        if (typeof part === "string") return part;
        const candidate =
          part?.text ?? part?.content ?? part?.output_text ?? "";
        if (typeof candidate === "string") return candidate;
        if (candidate && typeof candidate === "object" && "value" in candidate)
          return String((candidate as { value: unknown }).value ?? "");
        return "";
      })
      .join("");
  if (content && typeof content === "object" && "text" in content)
    return String((content as { text: unknown }).text);
  return JSON.stringify(content ?? "");
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  return start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced;
}

export function parseCropAnalysis(content: unknown): CropAnalysis {
  const text = extractJsonObject(contentToText(content));
  try {
    const candidate = JSON.parse(text);
    if (candidate && typeof candidate === "object") {
      const legacy = candidate as Record<string, unknown>;
      legacy.care_steps ??= legacy.recommendation
        ? [legacy.recommendation]
        : [];
      legacy.prevention_actions ??= [];
      legacy.visible_symptoms ??= [];
      legacy.treatment_category ??= "No treatment recommendation yet";
      legacy.treatment_guidance ??=
        "Confirm the crop and problem with a local agricultural extension professional before selecting any treatment.";
    }
    return cropAnalysisSchema.parse(candidate);
  } catch {
    throw new Error(
      "The AI returned an invalid analysis. Please try another clear image."
    );
  }
}

export function createUnassessedCropAnalysis(): CropAnalysis {
  return {
    crop: "Plant not identified",
    plant_identified: false,
    plant_identity_confidence: 0,
    health_status: "Uncertain",
    possible_condition: "Unable to assess from this image",
    confidence: 0,
    severity: "Undetermined",
    visible_symptoms: [],
    recommendation:
      "Take another photo of one plant or leaf in daylight. Keep it in focus, fill most of the frame, and avoid showing farm equipment or wide field scenes.",
    care_steps: [
      "Photograph one leaf, stem, fruit, or whole plant in daylight.",
      "Keep the plant in focus and fill most of the frame.",
      "Do not apply a treatment until the plant and problem are clear.",
    ],
    prevention_actions: [
      "Check plants regularly for new spots, pests, wilting, or yellowing.",
      "Keep tools and hands clean before moving between plants.",
    ],
    treatment_category:
      "No treatment recommended while identification is uncertain",
    treatment_guidance:
      "Do not buy or apply a pesticide from this result. Take a clearer photo and confirm the crop and problem with a local agricultural extension professional first.",
    expert_required: true,
    expert_guidance:
      "Consult a qualified agricultural expert if symptoms are spreading, the crop is declining quickly, or a clearer photo is still inconclusive.",
    uncertainty_reason:
      "The image or the AI response did not provide enough clear leaf detail for a reliable preliminary assessment.",
  };
}
