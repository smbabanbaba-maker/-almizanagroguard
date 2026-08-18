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
      .map((part: any) =>
        typeof part === "string" ? part : (part?.text ?? part?.content ?? "")
      )
      .join("");
  if (content && typeof content === "object" && "text" in content)
    return String((content as { text: unknown }).text);
  return JSON.stringify(content ?? "");
}

export function parseCropAnalysis(content: unknown): CropAnalysis {
  const text = contentToText(content).trim();
  try {
    return cropAnalysisSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(
      "The AI returned an invalid analysis. Please try another clear image."
    );
  }
}
