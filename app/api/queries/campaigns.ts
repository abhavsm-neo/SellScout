import { getDb } from "./connection";
import { campaigns, sequenceSteps } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertCampaign, InsertSequenceStep } from "@db/schema";

export async function findCampaignsByUser(userId: number) {
  return getDb().query.campaigns.findMany({
    where: eq(campaigns.userId, userId),
    with: { playbook: true },
    orderBy: desc(campaigns.createdAt),
  });
}

export async function findCampaignById(id: number, userId: number) {
  return getDb().query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
    with: { steps: true, playbook: true },
  });
}

export async function createCampaign(data: InsertCampaign) {
  const [result] = await getDb()
    .insert(campaigns)
    .values(data)
    .returning({ id: campaigns.id });
  return findCampaignById(result.id, data.userId);
}

export async function updateCampaign(id: number, userId: number, data: Partial<InsertCampaign>) {
  await getDb()
    .update(campaigns)
    .set(data)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
  return findCampaignById(id, userId);
}

export async function deleteCampaign(id: number, userId: number) {
  await getDb()
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

// ─── Sequence Steps ───

export async function findStepsByCampaign(campaignId: number) {
  return getDb().query.sequenceSteps.findMany({
    where: eq(sequenceSteps.campaignId, campaignId),
    orderBy: sequenceSteps.stepOrder,
  });
}

export async function createSequenceStep(data: InsertSequenceStep) {
  const [result] = await getDb()
    .insert(sequenceSteps)
    .values(data)
    .returning({ id: sequenceSteps.id });
  return getDb().query.sequenceSteps.findFirst({
    where: eq(sequenceSteps.id, result.id),
  });
}

export async function updateSequenceStep(id: number, data: Partial<InsertSequenceStep>) {
  await getDb().update(sequenceSteps).set(data).where(eq(sequenceSteps.id, id));
  return getDb().query.sequenceSteps.findFirst({ where: eq(sequenceSteps.id, id) });
}

export async function deleteSequenceStep(id: number) {
  await getDb().delete(sequenceSteps).where(eq(sequenceSteps.id, id));
}

export async function deleteStepsByCampaign(campaignId: number) {
  await getDb().delete(sequenceSteps).where(eq(sequenceSteps.campaignId, campaignId));
}
