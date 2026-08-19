import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { analyzeCropImage } from "./ai/cropAnalysis";
import { contentToText } from "./ai/resultParser";
import {
  saveCropAnalysis,
  getRecentScans,
  getFarmOverview,
  updateUserProfile,
} from "./db";

const questionSchema = z.object({
  question: z.string().trim().min(1).max(1200),
});
const imageSchema = z.object({
  imageDataUrl: z.string().min(100).max(12_000_000),
  cropType: z.string().trim().min(1).max(80).default("tomato"),
});
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 8) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (bucket.count >= limit)
    throw new Error(
      "You have reached the short-term request limit. Please wait a minute and try again."
    );
  bucket.count += 1;
}
async function withTimeout<T>(
  promise: Promise<T>,
  message: string,
  ms = 45_000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export function friendlyAiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("timeout"))
    return new Error(
      "AgroGuard took too long to respond. Please try again with a clearer image."
    );
  if (/413|payload too large|request entity too large/i.test(message))
    return new Error(
      "This image is too large for secure AI analysis. Please choose a smaller photo."
    );
  if (
    /401|403|api key|unauthorized|missing or invalid authorization/i.test(
      message
    )
  )
    return new Error(
      "Gemini could not verify the production AI key. Please check GEMINI_API_KEY in Vercel and redeploy."
    );
  if (/400.*(image|input|model|response_format)/i.test(message))
    return new Error(
      "The AI provider rejected this image request. Please try a clear JPG or PNG crop photo."
    );
  if (/invalid|configured/i.test(message)) return error;
  return new Error(
    "We couldn't complete the AI assessment right now. Please check your connection and try again."
  );
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cropHealth: router({
    analyze: publicProcedure
      .input(imageSchema)
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`scan:${ctx.user?.id ?? ctx.req.ip ?? "guest"}`);
        let analysis;
        try {
          analysis = await withTimeout(
            analyzeCropImage(input.imageDataUrl, input.cropType),
            "AI analysis timeout"
          );
        } catch (error) {
          console.error("[AgroGuard] Crop analysis failed", {
            message: error instanceof Error ? error.message : String(error),
          });
          throw friendlyAiError(error);
        }
        const extension = analysis.mimeType
          .split("/")[1]
          .replace("jpeg", "jpg");
        let stored: { key: string; url: string } | undefined;
        try {
          stored = await withTimeout(
            storagePut(
              `crop-scans/${ctx.user?.id ?? "guest"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
              analysis.imageBytes,
              analysis.mimeType
            ),
            "Storage upload timeout"
          );
        } catch (error) {
          console.warn("[AgroGuard] Optional image persistence skipped", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        let scanId: number | undefined;
        if (stored) {
          try {
            const saved = await saveCropAnalysis({
              userId: ctx.user?.id,
              cropType: input.cropType,
              imageKey: stored.key,
              imageUrl: stored.url,
              result: analysis.result,
            });
            scanId = saved.scanId;
          } catch (error) {
            console.warn("[AgroGuard] Optional analysis persistence skipped", {
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }
        return {
          crop: analysis.result.crop,
          possibleCondition: analysis.result.possible_condition,
          confidence: analysis.result.confidence,
          severity: analysis.result.severity,
          recommendation: analysis.result.recommendation,
          expertRequired: analysis.result.expert_required,
          expertGuidance: analysis.result.expert_guidance,
          uncertaintyReason: analysis.result.uncertainty_reason,
          confidenceBand: analysis.confidenceBand,
          scanId,
        };
      }),
    recent: protectedProcedure.query(({ ctx }) => getRecentScans(ctx.user.id)),
  }),
  profile: router({
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          email: z.string().email().max(320),
        })
      )
      .mutation(({ ctx, input }) =>
        updateUserProfile(ctx.user.id, input.name, input.email)
      ),
  }),
  farm: router({
    overview: protectedProcedure.query(({ ctx }) =>
      getFarmOverview(ctx.user.id)
    ),
  }),
  agroguard: router({
    ask: publicProcedure
      .input(questionSchema)
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`ask:${ctx.user?.id ?? ctx.req.ip ?? "guest"}`);
        let response;
        try {
          response = await withTimeout(
            invokeLLM({
              messages: [
                {
                  role: "system",
                  content:
                    "You are Ask AgroGuard, a careful agricultural extension assistant. Provide practical general guidance for African smallholder farmers. You may discuss crop care, soil, watering, pests, and climate-smart practices. You must clearly state that text-only guidance is not a disease diagnosis and direct the user to the Crop Health image workflow for image-based assessment. Do not claim to be a licensed agronomist.",
                },
                { role: "user", content: input.question },
              ],
            }),
            "AgroGuard chat timeout"
          );
        } catch (error) {
          throw friendlyAiError(error);
        }
        const content = response.choices?.[0]?.message?.content;
        const answer = contentToText(content).trim();
        return {
          answer:
            answer ||
            "I could not prepare guidance right now. Please try again.",
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
