import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Farm = typeof farms.$inferSelect;
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  variety: varchar("variety", { length: 120 }),
  plantedAt: timestamp("plantedAt"),
  status: mysqlEnum("status", ["active", "harvested", "archived"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Crop = typeof crops.$inferSelect;
export const cropHealthScans = mysqlTable("cropHealthScans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  farmId: int("farmId"),
  cropId: int("cropId"),
  cropType: varchar("cropType", { length: 80 }).notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  status: mysqlEnum("status", ["processing", "complete", "failed"])
    .default("processing")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CropHealthScan = typeof cropHealthScans.$inferSelect;
export const aiAnalysisResults = mysqlTable("aiAnalysisResults", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scanId").notNull(),
  crop: varchar("crop", { length: 80 }).notNull(),
  possibleCondition: varchar("possibleCondition", { length: 255 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  severity: varchar("severity", { length: 80 }).notNull(),
  recommendation: text("recommendation").notNull(),
  expertRequired: int("expertRequired").default(0).notNull(),
  expertGuidance: text("expertGuidance"),
  uncertaintyReason: text("uncertaintyReason"),
  rawJson: text("rawJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AIAnalysisResult = typeof aiAnalysisResults.$inferSelect;
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  scanId: int("scanId"),
  farmId: int("farmId"),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  source: varchar("source", { length: 80 }).default("agroguard-ai").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Recommendation = typeof recommendations.$inferSelect;
