import { getDb } from "./connection";
import { playbooks } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertPlaybook } from "@db/schema";

export async function findPlaybooksByUser(userId: number) {
  return getDb().query.playbooks.findMany({
    where: eq(playbooks.userId, userId),
    orderBy: desc(playbooks.updatedAt),
  });
}

export async function findPlaybookById(id: number, userId: number) {
  return getDb().query.playbooks.findFirst({
    where: and(eq(playbooks.id, id), eq(playbooks.userId, userId)),
  });
}

export async function createPlaybook(data: InsertPlaybook) {
  const [result] = await getDb()
    .insert(playbooks)
    .values(data)
    .returning({ id: playbooks.id });
  return findPlaybookById(result.id, data.userId);
}

export async function updatePlaybook(id: number, userId: number, data: Partial<InsertPlaybook>) {
  await getDb()
    .update(playbooks)
    .set(data)
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)));
  return findPlaybookById(id, userId);
}

export async function deletePlaybook(id: number, userId: number) {
  await getDb()
    .delete(playbooks)
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)));
}
