import {
  CropVisionModelAdapter,
  BuiltInVisionModelAdapter,
} from "./modelAdapter";
import { CropAnalysis, parseCropAnalysis } from "./resultParser";
export type { CropAnalysis } from "./resultParser";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function getConfidenceThresholds() {
  const high = Number(process.env.AGROGUARD_CONFIDENCE_HIGH ?? 70);
  const medium = Number(process.env.AGROGUARD_CONFIDENCE_MEDIUM ?? 50);
  if (
    !Number.isFinite(high) ||
    !Number.isFinite(medium) ||
    high <= medium ||
    medium < 0 ||
    high > 100
  )
    return { high: 70, medium: 50 };
  return { high, medium };
}
function validateImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(
    /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i
  );
  if (!match || !allowedMime.has(match[1].toLowerCase()))
    throw new Error("Please upload a JPG, PNG, WEBP, or HEIC image.");
  const bytes = Math.ceil((match[2].length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES)
    throw new Error("Images must be smaller than 8 MB.");
  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64"),
  };
}

export async function analyzeCropImage(
  imageDataUrl: string,
  cropType = "tomato",
  adapter: CropVisionModelAdapter = new BuiltInVisionModelAdapter()
): Promise<{
  result: CropAnalysis;
  imageBytes: Buffer;
  mimeType: string;
  confidenceBand: "high" | "medium" | "low";
}> {
  const { bytes, mimeType } = validateImageDataUrl(imageDataUrl);
  if (cropType.toLowerCase() !== "tomato")
    throw new Error(
      "The first AgroGuard model is configured for tomato images only."
    );
  const response = await adapter.analyze(imageDataUrl, cropType);
  const result = parseCropAnalysis(response.content);
  const thresholds = getConfidenceThresholds();
  const confidenceBand =
    result.confidence >= thresholds.high
      ? "high"
      : result.confidence >= thresholds.medium
        ? "medium"
        : "low";
  return { result, imageBytes: bytes, mimeType, confidenceBand };
}
