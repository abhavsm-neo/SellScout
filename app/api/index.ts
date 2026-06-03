import { Hono } from "hono";
import { handle } from "hono/vercel";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono();

// OAuth callback handler
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// tRPC API handler
app.use("/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Health check
app.get("/health", (c) => c.json({ ok: true, env: "vercel" }));

// 404 for unmatched API routes
app.all("/*", (c) => c.json({ error: "Not Found" }, 404));

// Vercel serverless handler
export default handle(app);
