import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  getDashboardMetrics,
  getCampaignPerformance,
  getTrendData,
  getRecentActivity,
} from "./queries/analytics";

export const analyticsRouter = createRouter({
  dashboard: authedQuery.query(({ ctx }) =>
    getDashboardMetrics(ctx.user.id),
  ),

  campaigns: authedQuery.query(({ ctx }) =>
    getCampaignPerformance(ctx.user.id),
  ),

  trends: authedQuery
    .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
    .query(({ ctx, input }) =>
      getTrendData(ctx.user.id, input?.days ?? 30),
    ),

  activity: authedQuery
    .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
    .query(({ ctx, input }) =>
      getRecentActivity(ctx.user.id, input?.limit ?? 20),
    ),
});
