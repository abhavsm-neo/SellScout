# SellScout Implementation Plan
## From Demo to Live Email-Sending Platform

**Date:** 2026-07-02
**Status:** Draft — Ready for Review

---

## 1. Current State Summary

### What's Working ✅
- **Database Schema:** 7 fully designed tables (users, playbooks, campaigns, sequenceSteps, prospects, campaignProspects, emailEvents) with proper enums, indexes, and relations.
- **Auth:** OAuth 2.0 via Kimi with JWT session cookies, auto-user creation on first login.
- **Backend:** Hono + tRPC API with proper middleware (auth, rate limiting, body limit).
- **Frontend:** Beautiful React + Tailwind UI with 4-step campaign builder wizard.
- **Database Queries:** Full CRUD for playbooks, campaigns, prospects, sequence steps, analytics.
- **Deployment:** Vercel serverless build pipeline working (server/ → api/index.js bundle).
- **Seed Script:** `db/seed.ts` exists with demo playbooks, prospects, and a demo user.

### What's Missing / Broken ❌
- **Email Infrastructure:** ZERO email sending capability. No ESP (Resend/SendGrid/Mailgun), no SMTP, no email service module.
- **Campaign Launch is a Stub:** `campaign.launch` only updates status to "active" and sets `launchedAt`. It does NOT:
  - Create `campaignProspects` junction records
  - Persist sequence steps from the frontend wizard
  - Send the first email
  - Schedule follow-up steps
- **Frontend Campaign Builder:** `handleLaunch` only calls `campaign.create` with hardcoded name "New Campaign". It doesn't:
  - Save the sequence steps configured in Step 3
  - Associate selected prospects with the campaign
  - Trigger the actual launch mutation with the right data
- **Analytics Returns Empty:** `emailEvents` table is never populated, so dashboard metrics, trend charts, and recent activity all return zeros/empty arrays.
- **Environment Variables:** `.env.example` has `VITE_APP_ID`/`VITE_APP_SECRET` but `server/lib/env.ts` reads `APP_ID`/`APP_SECRET` — mismatch causes auth failures in dev.
- **Seed Script Bug:** `db/seed.ts` imports from `../api/queries/connection` (old path) instead of `../server/queries/connection`.
- **No Email Tracking:** No webhook handlers for open/click/reply/bounce events.
- **No Compliance:** No unsubscribe links, no sender identity verification, no bounce handling.

---

## 2. Phase 1: Fix Foundation & Add Dummy Data

### 2.1 Fix Environment Variables
**File:** `.env.example`

```bash
# BEFORE (wrong)
VITE_APP_ID=your_app_id
VITE_APP_SECRET=your_app_secret

# AFTER (correct)
APP_ID=your_app_id
APP_SECRET=your_app_secret
```

Also add email-related placeholders:
```bash
# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=hello@sellscout.ai
RESEND_FROM_NAME=SellScout
```

### 2.2 Fix Seed Script Import Path
**File:** `db/seed.ts` — Line 1

```typescript
// BEFORE
import { getClient } from "../api/queries/connection";

// AFTER
import { getClient } from "../server/queries/connection";
```

### 2.3 Enhance Seed Script with Campaigns & Email Events

Add to `db/seed.ts` after the existing prospect seeding:

```typescript
// Seed campaigns (linked to playbooks)
const campaignData = [
  { playbookId: 1, name: "SellScout Q3 Outreach", status: "active" },
  { playbookId: 2, name: "DataSync Enterprise Pilot", status: "completed" },
  { playbookId: 1, name: "SellScout Product Hunt Launch", status: "draft" },
];

// Seed sequence steps for active campaign
const stepData = [
  { campaignId: 1, stepOrder: 1, day: 0, label: "Initial Outreach", subject: "Quick question about {{company}}'s sales process", body: "Hi {{first_name}},\n\nI noticed {{company}} has been scaling fast..." },
  { campaignId: 1, stepOrder: 2, day: 3, label: "Follow-up", subject: "Re: {{company}}'s outbound strategy", body: "Hi {{first_name}},\n\nJust following up on my email from a few days ago..." },
];

// Seed campaignProspects (link campaigns to prospects)
const campaignProspectData = [
  { campaignId: 1, prospectId: 1, status: "sent" },
  { campaignId: 1, prospectId: 2, status: "opened" },
  { campaignId: 1, prospectId: 3, status: "replied" },
  { campaignId: 1, prospectId: 4, status: "clicked" },
  { campaignId: 2, prospectId: 5, status: "sent" },
];

// Seed emailEvents (for analytics)
const emailEventData = [
  { campaignId: 1, prospectId: 1, type: "send" },
  { campaignId: 1, prospectId: 1, type: "open" },
  { campaignId: 1, prospectId: 2, type: "send" },
  { campaignId: 1, prospectId: 2, type: "open" },
  { campaignId: 1, prospectId: 2, type: "click" },
  { campaignId: 1, prospectId: 3, type: "send" },
  { campaignId: 1, prospectId: 3, type: "open" },
  { campaignId: 1, prospectId: 3, type: "reply" },
  { campaignId: 1, prospectId: 4, type: "send" },
  { campaignId: 1, prospectId: 4, type: "open" },
  { campaignId: 1, prospectId: 4, type: "click" },
  { campaignId: 1, prospectId: 4, type: "click" },
];
```

This gives the dashboard real metrics to display: open rates, reply rates, trend charts, and recent activity.

### 2.4 Add Seed Script to Package.json

```json
{
  "scripts": {
    "db:seed": "tsx db/seed.ts"
  }
}
```

> **Note:** Need to add `tsx` as a dev dependency if not already present.

**Deliverable:** Running `npm run db:seed` populates the database with a complete demo dataset. The dashboard shows real metrics, campaigns have sequence steps, and prospects are linked to campaigns.

---

## 3. Phase 2: Email Infrastructure (ESP Integration)

### 3.1 Choose Email Service Provider

**Recommendation: Resend**

| Provider | Free Tier | API Simplicity | Webhooks | Domain Verification | Best For |
|----------|-----------|---------------|----------|---------------------|----------|
| **Resend** | 3,000 emails/mo | Excellent (1-line send) | Native | Simple | Startups, dev-friendly |
| SendGrid | 100 emails/day | Good | Native | Moderate | Enterprise scale |
| Mailgun | 5,000 emails/3mo | Good | Native | Moderate | Transactional focus |
| AWS SES | 62,000 emails/mo | Complex | Via SNS | Complex | Cost-sensitive at scale |

**Why Resend:**
- Cleanest API (literally `resend.emails.send({ to, from, subject, html })`)
- 3,000 free emails/month — plenty for MVP
- Built-in webhook support for open/click/bounce/reply
- Easy domain verification (just add DNS records)
- React Email support for beautiful templates

### 3.2 Add Resend Dependency

```bash
npm install resend
```

### 3.3 Create Email Service Module

**New File:** `server/lib/email.ts`

```typescript
import { Resend } from "resend";
import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(params: SendEmailParams) {
  if (!resend) {
    console.warn("[email] Resend not configured — email not sent");
    return { id: "mock-email-id", success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${env.resendFromName} <${env.resendFromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      tags: params.tags,
    });

    if (error) throw error;
    return { id: data?.id, success: true };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    throw err;
  }
}

// Mock mode for development without API key
export function isEmailConfigured() {
  return !!resend;
}
```

### 3.4 Update Environment Variables

**File:** `server/lib/env.ts`

```typescript
export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "hello@sellscout.ai",
  resendFromName: process.env.RESEND_FROM_NAME ?? "SellScout",
  // Webhook secret for verifying Resend webhooks
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
};
```

**File:** `.env.example`

```bash
# App
APP_ID=your_app_id
APP_SECRET=your_app_secret
DATABASE_URL=postgresql://...
KIMI_AUTH_URL=https://...
KIMI_OPEN_URL=https://...
OWNER_UNION_ID=your_union_id

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=hello@sellscout.ai
RESEND_FROM_NAME=SellScout
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Deliverable:** Email service module ready. In dev mode without API key, it logs a warning and returns a mock ID. In production with API key, it sends real emails via Resend.

---

## 4. Phase 3: Fix Campaign Launch & Sending

### 4.1 The Problem

Current `campaign.launch` mutation:
```typescript
launch: authedQuery
  .input(z.object({ id: z.number() }))
  .mutation(({ ctx, input }) =>
    updateCampaign(input.id, ctx.user.id, {
      status: "active",
      launchedAt: new Date(),
    }),
  ),
```

This does nothing useful. It needs to:
1. Create `campaignProspects` records linking the campaign to selected prospects
2. Send the first email (step 0) to each prospect immediately
3. Schedule follow-up emails (step 1, 2, etc.) for their respective `day` offsets

### 4.2 Update Launch Mutation

**File:** `server/campaignRouter.ts`

Replace the `launch` mutation:

```typescript
launch: authedQuery
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const campaign = await findCampaignById(input.id, ctx.user.id);
    if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    if (campaign.status === "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign already active" });

    // 1. Get sequence steps for this campaign
    const steps = await findStepsByCampaign(input.id);
    if (steps.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No sequence steps configured" });

    // 2. Get prospects linked to this campaign (via campaignProspects)
    //    For now, we need a way to associate prospects. The frontend should pass them.
    //    OR we create a separate mutation to add prospects to a campaign first.
    
    // 3. Update campaign status
    await updateCampaign(input.id, ctx.user.id, {
      status: "active",
      launchedAt: new Date(),
    });

    // 4. Send first step (day 0) emails immediately
    const firstStep = steps.find(s => s.day === 0) || steps[0];
    // ... send emails via email service ...

    return { success: true, campaignId: input.id, stepsSent: steps.length };
  }),
```

### 4.3 Add Prospects to Campaign Mutation

**New mutation in `campaignRouter.ts`:**

```typescript
addProspects: authedQuery
  .input(z.object({
    campaignId: z.number(),
    prospectIds: z.array(z.number()),
  }))
  .mutation(async ({ ctx, input }) => {
    const { campaignId, prospectIds } = input;
    
    // Verify campaign belongs to user
    const campaign = await findCampaignById(campaignId, ctx.user.id);
    if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
    
    // Create campaignProspects records
    const db = getDb();
    await db.insert(campaignProspects).values(
      prospectIds.map(pid => ({
        campaignId,
        prospectId: pid,
        status: "pending" as const,
      }))
    );
    
    return { added: prospectIds.length };
  }),
```

### 4.4 Create Email Template Engine

**New File:** `server/lib/email-templates.ts`

```typescript
export interface TemplateVars {
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  industry: string;
}

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{first_name\}\}/g, vars.first_name)
    .replace(/\{\{last_name\}\}/g, vars.last_name)
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{title\}\}/g, vars.title)
    .replace(/\{\{industry\}\}/g, vars.industry);
}

export function wrapEmail(body: string, unsubscribeUrl?: string): string {
  const footer = unsubscribeUrl
    ? `<p style="font-size:12px;color:#666;margin-top:40px;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>`
    : "";
  
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  ${body.replace(/\n/g, "<br>")}
  ${footer}
</body>
</html>`;
}
```

### 4.5 Update Frontend Campaign Builder

**File:** `src/components/campaign-builder/` (or wherever the wizard lives)

The `handleLaunch` function needs to:
1. Call `campaign.create` with the selected playbook, name, and configured steps
2. Call `campaign.addProspects` with the selected prospect IDs
3. Call `campaign.launch` to trigger sending

```typescript
async function handleLaunch() {
  // Step 1: Create campaign
  const campaign = await trpc.campaign.create.mutate({
    playbookId: selectedPlaybookId,
    name: campaignName,
  });

  // Step 2: Create sequence steps
  for (const step of sequenceSteps) {
    await trpc.campaign.createStep.mutate({
      campaignId: campaign.id,
      stepOrder: step.order,
      day: step.day,
      label: step.label,
      subject: step.subject,
      body: step.body,
    });
  }

  // Step 3: Add prospects
  await trpc.campaign.addProspects.mutate({
    campaignId: campaign.id,
    prospectIds: selectedProspectIds,
  });

  // Step 4: Launch!
  await trpc.campaign.launch.mutate({ id: campaign.id });

  toast.success("Campaign launched!");
}
```

**Deliverable:** Campaign launch actually creates records, sends emails, and the frontend wizard persists all configured data.

---

## 5. Phase 4: Email Tracking & Webhooks

### 5.1 Create Webhook Handler

**New File:** `server/webhooks/resend.ts`

```typescript
import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { emailEvents, campaignProspects, campaigns } from "@db/schema";
import { eq } from "drizzle-orm";

const webhookRouter = new Hono();

webhookRouter.post("/resend", async (c) => {
  const payload = await c.req.json();
  
  // Verify webhook signature (Resend sends x-resend-signature header)
  // For now, skip verification in dev; add in production
  
  const { type, email_id, to } = payload;
  
  // Find the campaignProspect by email + email_id tag
  // We need to store the Resend email ID when sending to match it back
  
  // Log the event
  console.log("[webhook] Resend event:", type, email_id);
  
  // Update campaignProspects status and create emailEvents record
  // ... implementation ...
  
  return c.json({ received: true });
});

export default webhookRouter;
```

### 5.2 Store Resend Email ID on Send

When sending via `sendEmail`, store the returned `id` in a new column or metadata table so we can match webhook events back to the right prospect/campaign.

**Schema Update:** Add `resendEmailId` to `campaignProspects` or create a `sentEmails` table:

```typescript
// Option A: Add to campaignProspects
export const campaignProspects = pgTable("campaign_prospects", {
  // ... existing columns ...
  resendEmailId: varchar("resend_email_id", { length: 255 }), // tracks the ESP email ID
  stepId: integer("step_id"), // which sequence step this was
});
```

### 5.3 Update Campaign Metrics on Events

When a webhook comes in:
1. Find the matching `campaignProspects` record by `resendEmailId`
2. Update `campaignProspects.status` (opened → "opened", clicked → "clicked", etc.)
3. Insert a record into `emailEvents`
4. Increment the corresponding counter on `campaigns` (totalOpened, totalClicked, etc.)

```typescript
async function handleOpenEvent(resendEmailId: string) {
  const db = getDb();
  
  // Find campaign prospect
  const cp = await db.query.campaignProspects.findFirst({
    where: eq(campaignProspects.resendEmailId, resendEmailId),
    with: { campaign: true },
  });
  
  if (!cp) return;
  
  // Update status
  await db.update(campaignProspects)
    .set({ status: "opened" })
    .where(eq(campaignProspects.id, cp.id));
  
  // Create event
  await db.insert(emailEvents).values({
    campaignId: cp.campaignId,
    prospectId: cp.prospectId,
    type: "open",
  });
  
  // Increment campaign counter
  await db.update(campaigns)
    .set({ totalOpened: sql`${campaigns.totalOpened} + 1` })
    .where(eq(campaigns.id, cp.campaignId));
}
```

**Deliverable:** Real-time email tracking. Dashboard shows actual open/click/reply data as events come in.

---

## 6. Phase 5: Follow-Up Scheduling

### 5.1 The Problem

Sequence steps have a `day` field (0, 3, 7, 14, etc.). After sending step 0 (day 0), we need to send step 1 on day 3, step 2 on day 7, etc.

### 5.2 Options for Scheduling

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Vercel Cron** | Native, free, simple | Max 1 min execution, limited scheduling | MVP, low volume |
| **Inngest** | Purpose-built for jobs, retries, observability | Paid, extra dependency | Production, reliability |
| **QStash (Upstash)** | Serverless queues, simple API | Paid, extra service | Production, high volume |
| **BullMQ + Redis** | Full-featured, open source | Needs Redis, infra overhead | Self-hosted, scale |
| **pg-boss** | Postgres-based, no extra infra | Less mature | Simple, no extra services |

**Recommendation for MVP: Vercel Cron**

Vercel has built-in cron jobs (up to 2 per project on free tier). We can run a daily job that checks for emails to send.

### 5.3 Vercel Cron Setup

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/send-followups",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**New File:** `server/cron/send-followups.ts`

```typescript
import { Hono } from "hono";
import { getDb } from "../queries/connection";
import { campaigns, campaignProspects, sequenceSteps, prospects } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendEmail } from "../lib/email";
import { renderTemplate, wrapEmail } from "../lib/email-templates";

const app = new Hono();

app.get("/", async (c) => {
  const db = getDb();
  const today = new Date();
  
  // Find all active campaigns
  const activeCampaigns = await db.select().from(campaigns)
    .where(eq(campaigns.status, "active"));
  
  for (const campaign of activeCampaigns) {
    // Get all steps for this campaign
    const steps = await db.select().from(sequenceSteps)
      .where(eq(sequenceSteps.campaignId, campaign.id))
      .orderBy(sequenceSteps.stepOrder);
    
    // Get all campaign prospects
    const cps = await db.select().from(campaignProspects)
      .where(eq(campaignProspects.campaignId, campaign.id));
    
    for (const cp of cps) {
      // Skip if bounced or unsubscribed
      if (cp.status === "bounced") continue;
      
      // Determine which step to send next based on days since launch
      const daysSinceLaunch = Math.floor((today.getTime() - campaign.launchedAt!.getTime()) / (1000 * 60 * 60 * 24));
      
      const nextStep = steps.find(s => s.day === daysSinceLaunch && s.day > 0);
      if (!nextStep) continue; // No step for today
      
      // Check if already sent this step
      const alreadySent = await db.select().from(emailEvents)
        .where(and(
          eq(emailEvents.campaignId, campaign.id),
          eq(emailEvents.prospectId, cp.prospectId),
          // We'd need a stepId on emailEvents to check this properly
        ));
      
      // Send the email
      const prospect = await db.select().from(prospects)
        .where(eq(prospects.id, cp.prospectId))
        .limit(1);
      
      if (!prospect[0]) continue;
      
      const subject = renderTemplate(nextStep.subject, {
        first_name: prospect[0].firstName,
        last_name: prospect[0].lastName,
        company: prospect[0].company ?? "",
        title: prospect[0].title ?? "",
        industry: prospect[0].industry ?? "",
      });
      
      const body = renderTemplate(nextStep.body, {
        first_name: prospect[0].firstName,
        last_name: prospect[0].lastName,
        company: prospect[0].company ?? "",
        title: prospect[0].title ?? "",
        industry: prospect[0].industry ?? "",
      });
      
      await sendEmail({
        to: prospect[0].email,
        subject,
        html: wrapEmail(body),
        tags: [
          { name: "campaign_id", value: String(campaign.id) },
          { name: "prospect_id", value: String(cp.prospectId) },
          { name: "step_id", value: String(nextStep.id) },
        ],
      });
    }
  }
  
  return c.json({ processed: activeCampaigns.length });
});

export default app;
```

**Note:** Vercel Cron requires the route to be in `api/`. Since we bundle from `server/`, we need to add this to the build script or create a separate entry point.

**Deliverable:** Daily at 9 AM, the cron job checks all active campaigns and sends follow-up emails to prospects based on their sequence step schedule.

---

## 7. Phase 6: Compliance & Polish

### 7.1 Unsubscribe Links

Every email must include an unsubscribe link. Add to `wrapEmail`:

```typescript
const unsubscribeUrl = `${env.appUrl}/unsubscribe?token=${unsubscribeToken}`;
```

**New File:** `server/routes/unsubscribe.ts`

```typescript
app.get("/unsubscribe", async (c) => {
  const token = c.req.query("token");
  // Verify token, update prospect preference, show confirmation page
});
```

### 7.2 Sender Identity Verification

Before sending from a domain, verify it with Resend:
1. Add DNS records (SPF, DKIM, DMARC)
2. Resend validates domain ownership
3. Only send from verified domains

### 7.3 Rate Limiting

Already have basic rate limiting. Add email-specific limits:
- Max 100 emails per campaign per day
- Max 5 campaigns active per user
- Stagger sends (don't blast all at once)

### 7.4 Bounce Handling

Webhook already handles bounces. Add:
- Auto-pause campaign if bounce rate > 5%
- Alert user to clean their list
- Mark bounced prospects as "bounced" status

---

## 8. Implementation Order & Estimates

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| **1** | Fix `.env.example` mismatch | 5 min | P0 |
| **1** | Fix seed script import path | 5 min | P0 |
| **1** | Enhance seed with campaigns/steps/events | 30 min | P0 |
| **1** | Run seed & verify dashboard | 15 min | P0 |
| **2** | Install Resend SDK | 5 min | P1 |
| **2** | Create `server/lib/email.ts` | 30 min | P1 |
| **2** | Update `server/lib/env.ts` | 10 min | P1 |
| **3** | Create `server/lib/email-templates.ts` | 20 min | P1 |
| **3** | Add `addProspects` mutation | 20 min | P1 |
| **3** | Rewrite `launch` mutation | 45 min | P1 |
| **3** | Update frontend `handleLaunch` | 30 min | P1 |
| **3** | Test end-to-end campaign launch | 30 min | P1 |
| **4** | Create webhook handler | 30 min | P2 |
| **4** | Add `resendEmailId` to schema | 15 min | P2 |
| **4** | Update metrics on webhook events | 30 min | P2 |
| **5** | Set up Vercel Cron | 15 min | P2 |
| **5** | Create follow-up job | 45 min | P2 |
| **6** | Add unsubscribe links | 30 min | P3 |
| **6** | Add bounce rate alerts | 20 min | P3 |

**Total MVP Estimate:** ~8-10 hours of focused work

---

## 9. Getting Started Checklist

### Immediate (Do This Now)

- [ ] Fix `.env.example` — change `VITE_APP_ID` → `APP_ID`, `VITE_APP_SECRET` → `APP_SECRET`
- [ ] Fix `db/seed.ts` line 1 — change `../api/queries/connection` → `../server/queries/connection`
- [ ] Add campaigns, sequence steps, campaignProspects, and emailEvents to `db/seed.ts`
- [ ] Run `npm run db:seed` (or `npx tsx db/seed.ts`)
- [ ] Verify dashboard shows real metrics

### Next (Email Infrastructure)

- [ ] Sign up for Resend at [resend.com](https://resend.com)
- [ ] Verify a domain (or use `onboarding@resend.dev` for testing)
- [ ] Copy API key to `.env` as `RESEND_API_KEY`
- [ ] Install Resend: `npm install resend`
- [ ] Create `server/lib/email.ts`
- [ ] Test sending a single email via API

### Then (Campaign Launch)

- [ ] Create `server/lib/email-templates.ts`
- [ ] Add `addProspects` mutation to `campaignRouter.ts`
- [ ] Rewrite `launch` mutation to actually send emails
- [ ] Update frontend wizard to persist steps and trigger launch
- [ ] Test full flow: create campaign → add prospects → configure steps → launch → receive email

### Finally (Tracking & Follow-ups)

- [ ] Set up Resend webhook URL pointing to your Vercel deployment
- [ ] Create webhook handler route
- [ ] Add `resendEmailId` column to track sent emails
- [ ] Set up Vercel Cron for daily follow-ups
- [ ] Test open/click tracking

---

## 10. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui + tRPC |
| Backend | Hono + tRPC + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | OAuth 2.0 (Kimi) + JWT cookies |
| Email ESP | Resend |
| Hosting | Vercel (serverless) |
| Scheduling | Vercel Cron |
| Build | Custom `scripts/build.js` (Vite + esbuild) |

---

## 11. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Vite + Tailwind + shadcn/ui + tRPC Client         │
│                                                             │
│  Campaign Builder Wizard:                                   │
│  Step 1: Select Playbook  →  Step 2: Select Prospects      │
│  Step 3: Configure Sequence  →  Step 4: Launch             │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC API calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Vercel)                        │
│  Hono + tRPC Server                                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth Router │  │ Campaign    │  │ Analytics Router    │  │
│  │ (OAuth)     │  │ Router      │  │                     │  │
│  └─────────────┘  │ - create    │  └─────────────────────┘  │
│                   │ - launch    │                           │
│  ┌─────────────┐  │ - addProspects│  ┌─────────────────────┐  │
│  │ Webhooks    │  │ - steps CRUD│  │ Cron: Send Follow-ups│  │
│  │ (Resend)    │  └─────────────┘  │ (Daily 9 AM)        │  │
│  └─────────────┘                    └─────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Email Service (Resend SDK)                          │   │
│  │ - sendEmail()                                       │   │
│  │ - renderTemplate()                                  │   │
│  │ - wrapEmail() (unsubscribe footer)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                   │
│  users | playbooks | campaigns | sequenceSteps | prospects    │
│  campaignProspects | emailEvents                             │
└─────────────────────────────────────────────────────────────┘
                       ▲
                       │ Webhooks
┌─────────────────────────────────────────────────────────────┐
│                      RESEND (ESP)                            │
│  - Send emails                                               │
│  - Track opens, clicks, replies, bounces                    │
│  - Webhooks → Backend                                        │
└─────────────────────────────────────────────────────────────┘
```

---

*Plan created by SellScout AI. Ready to implement phase by phase.*
