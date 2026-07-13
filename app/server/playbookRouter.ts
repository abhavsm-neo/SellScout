import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import {
  findPlaybooksByUser,
  findPlaybookById,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
} from "./queries/playbooks";

export const playbookRouter = createRouter({
  list: publicQuery.query(({ ctx }) =>
    findPlaybooksByUser(ctx.user?.id ?? 1),
  ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      findPlaybookById(input.id, ctx.user.id),
    ),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        description: z.string().optional(),
        productName: z.string().optional(),
        tagline: z.string().optional(),
        website: z.string().optional(),
        category: z.string().optional(),
        valuePropositions: z.array(z.string()).optional(),
        icpTitle: z.string().optional(),
        companySizes: z.array(z.string()).optional(),
        industries: z.array(z.string()).optional(),
        painPoints: z.array(z.string()).optional(),
        keyFeatures: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
        pricing: z.string().optional(),
        competitors: z.array(z.string()).optional(),
        differentiator: z.string().optional(),
        tone: z.string().optional(),
        maxLength: z.number().optional(),
        includeCTA: z.boolean().optional(),
        ctaText: z.string().optional(),
        signature: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createPlaybook({ ...input, userId: ctx.user.id, status: "draft" }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          color: z.string().optional(),
          status: z.enum(["draft", "active", "paused", "archived"]).optional(),
          description: z.string().optional(),
          productName: z.string().optional(),
          tagline: z.string().optional(),
          website: z.string().optional(),
          category: z.string().optional(),
          valuePropositions: z.array(z.string()).optional(),
          icpTitle: z.string().optional(),
          companySizes: z.array(z.string()).optional(),
          industries: z.array(z.string()).optional(),
          painPoints: z.array(z.string()).optional(),
          keyFeatures: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
          pricing: z.string().optional(),
          competitors: z.array(z.string()).optional(),
          differentiator: z.string().optional(),
          tone: z.string().optional(),
          maxLength: z.number().optional(),
          includeCTA: z.boolean().optional(),
          ctaText: z.string().optional(),
          signature: z.string().optional(),
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      updatePlaybook(input.id, ctx.user.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      deletePlaybook(input.id, ctx.user.id),
    ),
});
