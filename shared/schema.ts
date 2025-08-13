import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cashBoxes = pgTable("cash_boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  workerName: text("worker_name").notNull(),
  shift: integer("shift").notNull(), // 1 or 2
  valeAmount: decimal("vale_amount", { precision: 10, scale: 2 }).notNull(),
  breakdown: text("breakdown").notNull(), // JSON string of denomination breakdown
  totalBreakdown: decimal("total_breakdown", { precision: 10, scale: 2 }).notNull(),
});

export const reconciliationSessions = pgTable("reconciliation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  auditorName: text("auditor_name").notNull(),
  totalCashBoxes: integer("total_cash_boxes").notNull(),
  totalVales: decimal("total_vales", { precision: 10, scale: 2 }).notNull(),
  totalBreakdown: decimal("total_breakdown", { precision: 10, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 10, scale: 2 }).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCashBoxSchema = createInsertSchema(cashBoxes).pick({
  date: true,
  workerName: true,
  shift: true,
  valeAmount: true,
  breakdown: true,
  totalBreakdown: true,
});

export const insertReconciliationSessionSchema = createInsertSchema(reconciliationSessions).pick({
  date: true,
  auditorName: true,
  totalCashBoxes: true,
  totalVales: true,
  totalBreakdown: true,
  difference: true,
});

export type InsertCashBox = z.infer<typeof insertCashBoxSchema>;
export type CashBox = typeof cashBoxes.$inferSelect;
export type InsertReconciliationSession = z.infer<typeof insertReconciliationSessionSchema>;
export type ReconciliationSession = typeof reconciliationSessions.$inferSelect;

// Frontend types for the wizard
export type CashBreakdown = {
  "500": number;
  "200": number;
  "100": number;
  "50": number;
  "20": number;
  "10": number;
  "5": number;
  "2": number;
  "1": number;
  "0.50": number;
  "0.20": number;
  "0.10": number;
  "0.05": number;
  "0.02": number;
  "0.01": number;
};

export type CashBoxFormData = {
  date: string;
  workerName: string;
  shift: number;
  valeAmount: number;
  breakdown: CashBreakdown;
};

export type ReconciliationData = {
  totalCashBoxes: number;
  cashBoxes: CashBoxFormData[];
  currentStep: number;
  currentCashBoxIndex: number;
  auditorName: string;
};

// New table for saved names
export const savedNames = pgTable("saved_names", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'worker' or 'auditor'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertSavedNameSchema = createInsertSchema(savedNames).omit({
  id: true,
  createdAt: true
});

export type SavedName = typeof savedNames.$inferSelect;
export type InsertSavedName = z.infer<typeof insertSavedNameSchema>;
