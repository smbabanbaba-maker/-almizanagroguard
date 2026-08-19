import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  farms,
  crops,
  cropHealthScans,
  aiAnalysisResults,
  recommendations,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { CropAnalysis } from "./ai/cropAnalysis";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
export async function updateUserProfile(
  userId: number,
  name: string,
  email: string
) {
  const db = await getDb();
  if (!db) return undefined;
  await db
    .update(users)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0]);
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function saveCropAnalysis(input: {
  userId?: number;
  cropType: string;
  imageKey: string;
  imageUrl: string;
  result: CropAnalysis;
}) {
  const db = await getDb();
  if (!db) return { scanId: undefined };
  const scan = await db.insert(cropHealthScans).values({
    userId: input.userId,
    cropType: input.cropType,
    imageKey: input.imageKey,
    imageUrl: input.imageUrl,
    status: "complete",
  });
  const scanId = Number((scan as any).insertId);
  await db.insert(aiAnalysisResults).values({
    scanId,
    crop: input.result.crop,
    possibleCondition: input.result.possible_condition,
    confidence: input.result.confidence.toFixed(2),
    severity: input.result.severity,
    recommendation: input.result.recommendation,
    expertRequired: input.result.expert_required ? 1 : 0,
    expertGuidance: input.result.expert_guidance,
    uncertaintyReason: input.result.uncertainty_reason,
    rawJson: JSON.stringify(input.result),
  });
  await db.insert(recommendations).values({
    userId: input.userId,
    scanId,
    title: "Crop health next step",
    body: input.result.recommendation,
  });
  return { scanId };
}

export async function getRecentScans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cropHealthScans)
    .where(eq(cropHealthScans.userId, userId))
    .orderBy(desc(cropHealthScans.createdAt))
    .limit(10);
}

export async function getFarmProfile(userId: number) {
  const db = await getDb();
  if (!db) return { farm: undefined, crops: [] };
  const farmRows = await db
    .select()
    .from(farms)
    .where(eq(farms.userId, userId))
    .orderBy(desc(farms.updatedAt))
    .limit(1);
  const farm = farmRows[0];
  if (!farm) return { farm: undefined, crops: [] };
  const cropRows = await db
    .select()
    .from(crops)
    .where(eq(crops.farmId, farm.id))
    .orderBy(desc(crops.createdAt))
    .limit(24);
  return { farm, crops: cropRows };
}

export async function saveFarmProfile(input: {
  userId: number;
  name: string;
  location?: string;
  cropNames: string[];
}) {
  const db = await getDb();
  if (!db) return { farm: undefined, crops: [] };
  const current = await getFarmProfile(input.userId);
  let farmId = current.farm?.id;
  if (farmId) {
    await db
      .update(farms)
      .set({
        name: input.name,
        location: input.location || null,
        updatedAt: new Date(),
      })
      .where(eq(farms.id, farmId));
  } else {
    const inserted = await db.insert(farms).values({
      userId: input.userId,
      name: input.name,
      location: input.location || null,
    });
    farmId = Number((inserted as any).insertId);
  }

  const existingNames = new Set(
    current.crops.map(crop => crop.name.trim().toLowerCase())
  );
  const namesToAdd = Array.from(
    new Set(input.cropNames.map(name => name.trim()))
  )
    .filter(Boolean)
    .filter(name => !existingNames.has(name.toLowerCase()));
  if (namesToAdd.length) {
    await db.insert(crops).values(
      namesToAdd.map(name => ({
        farmId: farmId!,
        name,
        status: "active" as const,
      }))
    );
  }
  return getFarmProfile(input.userId);
}

export async function getFarmOverview(userId: number) {
  const db = await getDb();
  if (!db) return { farms: [], scans: [], analyses: [], recommendations: [] };
  const [farmRows, scanRows, recommendationRows] = await Promise.all([
    db.select().from(farms).where(eq(farms.userId, userId)).limit(10),
    db
      .select()
      .from(cropHealthScans)
      .where(eq(cropHealthScans.userId, userId))
      .orderBy(desc(cropHealthScans.createdAt))
      .limit(10),
    db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt))
      .limit(10),
  ]);
  const scanIds = scanRows.map(scan => scan.id);
  const analysisRows = scanIds.length
    ? await db
        .select()
        .from(aiAnalysisResults)
        .where(inArray(aiAnalysisResults.scanId, scanIds))
        .orderBy(desc(aiAnalysisResults.createdAt))
        .limit(10)
    : [];
  return {
    farms: farmRows,
    scans: scanRows,
    analyses: analysisRows,
    recommendations: recommendationRows,
  };
}
