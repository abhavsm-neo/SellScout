import { getDb } from "./connection";
import { prospects } from "@db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import type { InsertProspect } from "@db/schema";

export async function findProspectsByUser(userId: number, search?: string) {
  const db = getDb();
  if (search) {
    return db.query.prospects.findMany({
      where: and(
        eq(prospects.userId, userId),
        like(prospects.email, `%${search}%`)
      ),
      orderBy: desc(prospects.createdAt),
    });
  }
  return db.query.prospects.findMany({
    where: eq(prospects.userId, userId),
    orderBy: desc(prospects.createdAt),
  });
}

export async function findProspectById(id: number, userId: number) {
  return getDb().query.prospects.findFirst({
    where: and(eq(prospects.id, id), eq(prospects.userId, userId)),
  });
}

export async function createProspect(data: InsertProspect) {
  const [result] = await getDb()
    .insert(prospects)
    .values(data)
    .returning({ id: prospects.id });
  return findProspectById(result.id, data.userId);
}

export async function createProspectsBatch(data: InsertProspect[]) {
  if (data.length === 0) return [];
  const db = getDb();
  const results = await db
    .insert(prospects)
    .values(data)
    .returning({ id: prospects.id });
  return Promise.all(
    results.map((r: { id: number }, i: number) => findProspectById(r.id, data[i].userId))
  );
}

export async function updateProspect(id: number, userId: number, data: Partial<InsertProspect>) {
  await getDb()
    .update(prospects)
    .set(data)
    .where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
  return findProspectById(id, userId);
}

export async function deleteProspect(id: number, userId: number) {
  await getDb()
    .delete(prospects)
    .where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
}
