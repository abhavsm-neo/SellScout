import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  json,
  mysqlEnum,
  bigint,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users (auth feature) ───
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Playbooks ───
export const playbooks = mysqlTable("playbooks", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#C8A45E").notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
  description: text("description"),
  productName: varchar("productName", { length: 255 }),
  tagline: varchar("tagline", { length: 500 }),
  website: varchar("website", { length: 500 }),
  category: varchar("category", { length: 100 }),
  valuePropositions: json("valuePropositions").$type<string[]>(),
  icpTitle: varchar("icpTitle", { length: 500 }),
  companySizes: json("companySizes").$type<string[]>(),
  industries: json("industries").$type<string[]>(),
  painPoints: json("painPoints").$type<string[]>(),
  keyFeatures: json("keyFeatures").$type<Array<{ name: string; description: string }>>(),
  pricing: varchar("pricing", { length: 100 }),
  competitors: json("competitors").$type<string[]>(),
  differentiator: text("differentiator"),
  tone: varchar("tone", { length: 50 }),
  maxLength: int("maxLength").default(150),
  includeCTA: boolean("includeCTA").default(true),
  ctaText: varchar("ctaText", { length: 255 }),
  signature: text("signature"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index("playbook_user_id_idx").on(table.userId),
  statusIdx: index("playbook_status_idx").on(table.status),
}));

export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = typeof playbooks.$inferInsert;

// ─── Campaigns ───
export const campaigns = mysqlTable("campaigns", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  playbookId: bigint("playbookId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  totalSent: int("totalSent").default(0),
  totalOpened: int("totalOpened").default(0),
  totalClicked: int("totalClicked").default(0),
  totalReplied: int("totalReplied").default(0),
  totalBounced: int("totalBounced").default(0),
  meetingsBooked: int("meetingsBooked").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  launchedAt: timestamp("launchedAt"),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("campaign_user_id_idx").on(table.userId),
  playbookIdIdx: index("campaign_playbook_id_idx").on(table.playbookId),
  statusIdx: index("campaign_status_idx").on(table.status),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Sequence Steps ───
export const sequenceSteps = mysqlTable("sequence_steps", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  campaignId: bigint("campaignId", { mode: "number", unsigned: true }).notNull(),
  stepOrder: int("stepOrder").notNull(),
  day: int("day").default(0).notNull(),
  type: mysqlEnum("type", ["email", "linkedin"]).default("email").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  campaignIdIdx: index("step_campaign_id_idx").on(table.campaignId),
}));

export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type InsertSequenceStep = typeof sequenceSteps.$inferInsert;

// ─── Prospects ───
export const prospects = mysqlTable("prospects", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 255 }),
  linkedin: varchar("linkedin", { length: 500 }),
  industry: varchar("industry", { length: 255 }),
  companySize: varchar("companySize", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("prospect_user_id_idx").on(table.userId),
  emailIdx: index("prospect_email_idx").on(table.email),
}));

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

// ─── Campaign Prospects (junction) ───
export const campaignProspects = mysqlTable("campaign_prospects", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  campaignId: bigint("campaignId", { mode: "number", unsigned: true }).notNull(),
  prospectId: bigint("prospectId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "opened", "clicked", "replied", "bounced"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignIdIdx: index("cp_campaign_id_idx").on(table.campaignId),
  prospectIdIdx: index("cp_prospect_id_idx").on(table.prospectId),
}));

export type CampaignProspect = typeof campaignProspects.$inferSelect;
export type InsertCampaignProspect = typeof campaignProspects.$inferInsert;

// ─── Email Events ───
export const emailEvents = mysqlTable("email_events", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  campaignId: bigint("campaignId", { mode: "number", unsigned: true }).notNull(),
  prospectId: bigint("prospectId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["send", "open", "click", "reply", "bounce"]).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignIdIdx: index("event_campaign_id_idx").on(table.campaignId),
  typeIdx: index("event_type_idx").on(table.type),
  createdAtIdx: index("event_created_at_idx").on(table.createdAt),
}));

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;
