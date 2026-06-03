import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findProspectsByUser,
  findProspectById,
  createProspect,
  createProspectsBatch,
  updateProspect,
  deleteProspect,
} from "./queries/prospects";

export const prospectRouter = createRouter({
  list: authedQuery
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ ctx, input }) =>
      findProspectsByUser(ctx.user.id, input?.search),
    ),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) =>
      findProspectById(input.id, ctx.user.id),
    ),

  create: authedQuery
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        title: z.string().optional(),
        linkedin: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createProspect({ ...input, userId: ctx.user.id }),
    ),

  createBatch: authedQuery
    .input(
      z.array(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          company: z.string().optional(),
          title: z.string().optional(),
          linkedin: z.string().optional(),
          industry: z.string().optional(),
          companySize: z.string().optional(),
        }),
      ),
    )
    .mutation(({ ctx, input }) =>
      createProspectsBatch(input.map(p => ({ ...p, userId: ctx.user.id }))),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          company: z.string().optional(),
          title: z.string().optional(),
          linkedin: z.string().optional(),
          industry: z.string().optional(),
          companySize: z.string().optional(),
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateProspect(input.id, ctx.user.id, input.data),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      deleteProspect(input.id, ctx.user.id),
    ),
});
