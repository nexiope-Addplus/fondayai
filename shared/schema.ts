import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  kakaoId: text("kakao_id").unique(),
  email: text("email"),
  avatar: text("avatar"),
});

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  overallScore: text("overall_score").notNull(),
  scores: text("scores").notNull(), // JSON string
  hotspots: text("hotspots").notNull(), // JSON string
  aiComment: text("ai_comment"),
  imageSrc: text("image_src"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
...
  email: true,
  avatar: true,
});

export const insertScanSchema = createInsertSchema(scans);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
