import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  json,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const playbookStatusEnum = pgEnum("playbook_status", ["draft", "active", "paused", "archived"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "paused", "completed"]);
export const stepTypeEnum = pgEnum("step_type", ["email", "linkedin"]);
export const prospectStatusEnum = pgEnum("prospect_status", ["pending", "sent", "opened", "clicked", "replied", "bounced"]);
export const eventTypeEnum = pgEnum("event_type", ["send", "open", "click", "reply", "bounce"]);

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("union_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Playbooks ───
export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#C8A45E").notNull(),
  status: playbookStatusEnum("status").default("draft").notNull(),
  description: text("description"),
  productName: varchar("product_name", { length: 255 }),
  tagline: varchar("tagline", { length: 500 }),
  website: varchar("website", { length: 500 }),
  category: varchar("category", { length: 100 }),
  valuePropositions: json("value_propositions").$type<string[]>(),
  icpTitle: varchar("icp_title", { length: 500 }),
  companySizes: json("company_sizes").$type<string[]>(),
  industries: json("industries").$type<string[]>(),
  painPoints: json("pain_points").$type<string[]>(),
  keyFeatures: json("key_features").$type<Array<{ name: string; description: string }>>(),
  pricing: varchar("pricing", { length: 100 }),
  competitors: json("competitors").$type<string[]>(),
  differentiator: text("differentiator"),
  tone: varchar("tone", { length: 50 }),
  maxLength: integer("max_length").default(150),
  includeCTA: boolean("include_cta").default(true),
  ctaText: varchar("cta_text", { length: 255 }),
  signature: text("signature"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("playbook_user_id_idx").on(table.userId),
  index("playbook_status_idx").on(table.status),
]);

export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = typeof playbooks.$inferInsert;

// ─── Campaigns ───
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  playbookId: integer("playbook_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: campaignStatusEnum("status").default("draft").notNull(),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalReplied: integer("total_replied").default(0),
  totalBounced: integer("total_bounced").default(0),
  meetingsBooked: integer("meetings_booked").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  launchedAt: timestamp("launched_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("campaign_user_id_idx").on(table.userId),
  index("campaign_playbook_id_idx").on(table.playbookId),
  index("campaign_status_idx").on(table.status),
]);

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Sequence Steps ───
export const sequenceSteps = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  stepOrder: integer("step_order").notNull(),
  day: integer("day").default(0).notNull(),
  type: stepTypeEnum("type").default("email").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("step_campaign_id_idx").on(table.campaignId),
]);

export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type InsertSequenceStep = typeof sequenceSteps.$inferInsert;

// ─── Prospects ───
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 255 }),
  linkedin: varchar("linkedin", { length: 500 }),
  industry: varchar("industry", { length: 255 }),
  companySize: varchar("company_size", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("prospect_user_id_idx").on(table.userId),
  index("prospect_email_idx").on(table.email),
]);

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

// ─── Campaign Prospects (junction) ───
export const campaignProspects = pgTable("campaign_prospects", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  prospectId: integer("prospect_id").notNull(),
  status: prospectStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("cp_campaign_id_idx").on(table.campaignId),
  index("cp_prospect_id_idx").on(table.prospectId),
]);

export type CampaignProspect = typeof campaignProspects.$inferSelect;
export type InsertCampaignProspect = typeof campaignProspects.$inferInsert;

// ─── Email Events ───
export const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  prospectId: integer("prospect_id").notNull(),
  type: eventTypeEnum("type").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("event_campaign_id_idx").on(table.campaignId),
  index("event_type_idx").on(table.type),
  index("event_created_at_idx").on(table.createdAt),
]);

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;
