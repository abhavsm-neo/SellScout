import "dotenv/config";

// Only DATABASE_URL is truly required in production (see VERCEL-DEPLOY.md).
// Kimi OAuth vars are optional — the app works without login. When they are
// absent the auth features simply stay disabled instead of crashing the
// whole serverless function at import time.
function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  return process.env[name] || fallback;
}

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.APP_ID || !process.env.APP_SECRET)
) {
  console.warn(
    "[env] APP_ID/APP_SECRET not set — OAuth login is disabled. " +
      "Set them in Vercel → Settings → Environment Variables to enable it.",
  );
}

export const env = {
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: optional("KIMI_AUTH_URL", "https://platform.kimi.ai"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
