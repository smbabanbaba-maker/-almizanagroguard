import { z } from "zod";

export const cropAnalysisSchema = z.object({
  crop: z.string().min(1).max(80),
  possible_condition: z.string().min(1).max(255),
  confidence: z.number().min(0).max(100),
  severity: z.string().min(1).max(80),
  recommendation: z.string().min(1).max(4000),
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
    return cropAnalysisSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(
      "The AI returned an invalid analysis. Please try another clear image."
    );
  }
}

export function createUnassessedCropAnalysis(): CropAnalysis {
  return {
    crop: "Tomato",
    possible_condition: "Unable to assess from this image",
    confidence: 0,
    severity: "Undetermined",
    recommendation:
      "Take another photo of one tomato leaf in daylight. Keep the leaf in focus, fill most of the frame, and avoid showing farm equipment or wide field scenes.",
    expert_required: true,
    expert_guidance:
      "Consult a qualified agricultural expert if symptoms are spreading, the crop is declining quickly, or a clearer photo is still inconclusive.",
    uncertainty_reason:
      "The image or the AI response did not provide enough clear leaf detail for a reliable preliminary assessment.",
  };
}
