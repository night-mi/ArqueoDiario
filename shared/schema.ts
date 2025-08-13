import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cashBoxes = pgTable("cash_boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => reconciliationSessions.id),
  date: date("date").notNull(),
  workerName: text("worker_name").notNull(),
  shift: integer("shift").notNull(), // 1 or 2
  valeAmount: decimal("vale_amount", { precision: 10, scale: 2 }).notNull(),
  breakdown: text("breakdown").notNull(), // JSON string of denomination breakdown
  totalBreakdown: decimal("total_breakdown", { precision: 10, scale: 2 }).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const reconciliationSessions = pgTable("reconciliation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionDate: date("session_date").notNull(), // Date when the reconciliation was performed
  auditorName: text("auditor_name").notNull(),
  totalCashBoxes: integer("total_cash_boxes").notNull(),
  totalVales: decimal("total_vales", { precision: 10, scale: 2 }).notNull(),
  totalBreakdown: decimal("total_breakdown", { precision: 10, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"), // completed, in_progress
  notes: text("notes"), // Optional notes about the reconciliation
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCashBoxSchema = createInsertSchema(cashBoxes).pick({
  sessionId: true,
  date: true,
  workerName: true,
  shift: true,
  valeAmount: true,
  breakdown: true,
  totalBreakdown: true,
});

export const insertReconciliationSessionSchema = createInsertSchema(reconciliationSessions).pick({
  sessionDate: true,
  auditorName: true,
  totalCashBoxes: true,
  totalVales: true,
  totalBreakdown: true,
  difference: true,
  status: true,
  notes: true,
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

// New table for storing generated reports
export const savedReports = pgTable("saved_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => reconciliationSessions.id),
  reportType: text("report_type").notNull(), // 'by_cash_box' or 'by_date'
  reportTitle: text("report_title").notNull(),
  reportContent: text("report_content").notNull(), // HTML content of the report
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertSavedNameSchema = createInsertSchema(savedNames).omit({
  id: true,
  createdAt: true
});

export const insertSavedReportSchema = createInsertSchema(savedReports).omit({
  id: true,
  createdAt: true,
  generatedAt: true
});

export type SavedName = typeof savedNames.$inferSelect;
export type InsertSavedName = z.infer<typeof insertSavedNameSchema>;
export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = z.infer<typeof insertSavedReportSchema>;

// Add relations for saved reports
export const savedReportsRelations = relations(savedReports, ({ one }) => ({
  session: one(reconciliationSessions, {
    fields: [savedReports.sessionId],
    references: [reconciliationSessions.id]
  })
}));

export const reconciliationSessionsReportsRelation = relations(reconciliationSessions, ({ many }) => ({
  reports: many(savedReports)
}));
