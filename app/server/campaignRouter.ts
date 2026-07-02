import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findCampaignsByUser,
  findCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  findStepsByCampaign,
  createSequenceStep,
  updateSequenceStep,
  deleteSequenceStep,
  deleteStepsByCampaign,
} from "./queries/campaigns";

export const campaignRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    findCampaignsByUser(ctx.user.id),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      findCampaignById(input.id, ctx.user.id),
    ),

  create: authedQuery
    .input(
      z.object({
        playbookId: z.number(),
        name: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      createCampaign({
        ...input,
        userId: ctx.user.id,
        status: "draft",
      }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          status: z.enum(["draft", "active", "paused", "completed"]).optional(),
          totalSent: z.number().optional(),
          totalOpened: z.number().optional(),
          totalClicked: z.number().optional(),
          totalReplied: z.number().optional(),
          totalBounced: z.number().optional(),
          meetingsBooked: z.number().optional(),
          launchedAt: z.date().optional(),
          completedAt: z.date().optional(),
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateCampaign(input.id, ctx.user.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteStepsByCampaign(input.id);
      await deleteCampaign(input.id, ctx.user.id);
    }),

  launch: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      updateCampaign(input.id, ctx.user.id, {
        status: "active",
        launchedAt: new Date(),
      }),
    ),

  // ─── Sequence Steps ───
  steps: authedQuery
    .input(z.object({ campaignId: z.number() }))
    .query(({ input }) =>
      findStepsByCampaign(input.campaignId),
    ),

  createStep: authedQuery
    .input(
      z.object({
        campaignId: z.number(),
        stepOrder: z.number(),
        day: z.number(),
        type: z.enum(["email", "linkedin"]).optional(),
        label: z.string(),
        subject: z.string(),
        body: z.string(),
      }),
    )
    .mutation(({ input }) =>
      createSequenceStep(input),
    ),

  updateStep: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          day: z.number().optional(),
          subject: z.string().optional(),
          body: z.string().optional(),
          label: z.string().optional(),
        }),
      }),
    )
    .mutation(({ input }) =>
      updateSequenceStep(input.id, input.data),
    ),

  deleteStep: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      deleteSequenceStep(input.id),
    ),
});
