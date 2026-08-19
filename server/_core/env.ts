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
  aiProvider: nonEmpty(process.env.AGROGUARD_AI_PROVIDER).toLowerCase() || "builtin",
  aiModel: nonEmpty(process.env.AGROGUARD_AI_MODEL),
};

export type AiProvider = "builtin" | "openai" | "gemini";

export function getConfiguredAiProvider(): AiProvider {
  if (ENV.aiProvider === "openai" || ENV.aiProvider === "gemini") {
    return ENV.aiProvider;
  }
  return "builtin";
}
