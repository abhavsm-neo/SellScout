import { relations } from "drizzle-orm";
import { users, playbooks, campaigns, sequenceSteps, prospects, campaignProspects, emailEvents } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  playbooks: many(playbooks),
  campaigns: many(campaigns),
  prospects: many(prospects),
}));

export const playbooksRelations = relations(playbooks, ({ one, many }) => ({
  user: one(users, { fields: [playbooks.userId], references: [users.id] }),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  playbook: one(playbooks, { fields: [campaigns.playbookId], references: [playbooks.id] }),
  steps: many(sequenceSteps),
  prospects: many(campaignProspects),
  events: many(emailEvents),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  campaign: one(campaigns, { fields: [sequenceSteps.campaignId], references: [campaigns.id] }),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  user: one(users, { fields: [prospects.userId], references: [users.id] }),
  campaigns: many(campaignProspects),
}));

export const campaignProspectsRelations = relations(campaignProspects, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignProspects.campaignId], references: [campaigns.id] }),
  prospect: one(prospects, { fields: [campaignProspects.prospectId], references: [prospects.id] }),
}));

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  campaign: one(campaigns, { fields: [emailEvents.campaignId], references: [campaigns.id] }),
  prospect: one(prospects, { fields: [emailEvents.prospectId], references: [prospects.id] }),
}));
