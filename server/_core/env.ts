const nonEmpty = (value: string | undefined) => value?.trim() || "";

export const ENV = {
  appId: nonEmpty(process.env.VITE_APP_ID),
  cookieSecret: nonEmpty(process.env.JWT_SECRET),
  databaseUrl: nonEmpty(process.env.DATABASE_URL),
  oAuthServerUrl: nonEmpty(process.env.OAUTH_SERVER_URL),
  ownerOpenId: nonEmpty(process.env.OWNER_OPEN_ID),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: nonEmpty(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: nonEmpty(process.env.BUILT_IN_FORGE_API_KEY),
  openAiApiKey: nonEmpty(process.env.OPENAI_API_KEY),
  geminiApiKey: nonEmpty(process.env.GEMINI_API_KEY),
  // AgroGuard production uses Gemini exclusively. This avoids silently
  // falling back to the legacy Manus or OpenAI paths when a Vercel variable
  // is omitted or misspelled.
  aiProvider: "gemini" as const,
  aiModel: nonEmpty(process.env.AGROGUARD_AI_MODEL),
};

export type AiProvider = "gemini";

export function getConfiguredAiProvider(): AiProvider {
  return "gemini";
}
