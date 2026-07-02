import { authRouter } from "./auth-router";
import { playbookRouter } from "./playbookRouter";
import { campaignRouter } from "./campaignRouter";
import { prospectRouter } from "./prospectRouter";
import { analyticsRouter } from "./analyticsRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  playbook: playbookRouter,
  campaign: campaignRouter,
  prospect: prospectRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
