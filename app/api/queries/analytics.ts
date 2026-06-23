import { getDb } from "./connection";
import { campaigns, emailEvents } from "@db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function getDashboardMetrics(userId: number) {
  const db = getDb();

  const [campaignData] = await db
    .select({
      totalSent: sql<number>`COALESCE(SUM(${campaigns.totalSent}), 0)`,
      totalOpened: sql<number>`COALESCE(SUM(${campaigns.totalOpened}), 0)`,
      totalReplied: sql<number>`COALESCE(SUM(${campaigns.totalReplied}), 0)`,
      meetingsBooked: sql<number>`COALESCE(SUM(${campaigns.meetingsBooked}), 0)`,
      activeCampaigns: sql<number>`COUNT(CASE WHEN ${campaigns.status} = 'active' THEN 1 END)`,
    })
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  const sent = Number(campaignData.totalSent) || 0;
  const opened = Number(campaignData.totalOpened) || 0;
  const replied = Number(campaignData.totalReplied) || 0;

  return {
    totalSent: sent,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    meetingsBooked: Number(campaignData.meetingsBooked) || 0,
    activeCampaigns: Number(campaignData.activeCampaigns) || 0,
  };
}

export async function getCampaignPerformance(userId: number) {
  const db = getDb();
  return db.query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
    with: { playbook: true },
    orderBy: desc(campaigns.createdAt),
  });
}

export async function getTrendData(userId: number, days: number) {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db
    .select({
      date: sql<string>`DATE(${emailEvents.createdAt})`,
      opens: sql<number>`SUM(CASE WHEN ${emailEvents.type} = 'open' THEN 1 ELSE 0 END)`,
      clicks: sql<number>`SUM(CASE WHEN ${emailEvents.type} = 'click' THEN 1 ELSE 0 END)`,
      replies: sql<number>`SUM(CASE WHEN ${emailEvents.type} = 'reply' THEN 1 ELSE 0 END)`,
      bounces: sql<number>`SUM(CASE WHEN ${emailEvents.type} = 'bounce' THEN 1 ELSE 0 END)`,
    })
    .from(emailEvents)
    .innerJoin(campaigns, eq(emailEvents.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.userId, userId),
        gte(emailEvents.createdAt, cutoff)
      )
    )
    .groupBy(sql`DATE(${emailEvents.createdAt})`)
    .orderBy(sql`DATE(${emailEvents.createdAt})`);
}

export async function getRecentActivity(userId: number, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: emailEvents.id,
      type: emailEvents.type,
      createdAt: emailEvents.createdAt,
      campaignName: campaigns.name,
    })
    .from(emailEvents)
    .innerJoin(campaigns, eq(emailEvents.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(emailEvents.createdAt))
    .limit(limit);
}
