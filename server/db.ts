import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  farms,
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
