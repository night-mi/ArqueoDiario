import { type CashBox, type InsertCashBox, type ReconciliationSession, type InsertReconciliationSession, type SavedName, type InsertSavedName, type SavedReport, type InsertSavedReport } from "@shared/schema";
import { db } from "./db";
import { savedNames, cashBoxes, reconciliationSessions, savedReports } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Cash Box operations
  createCashBox(cashBox: InsertCashBox): Promise<CashBox>;
  getCashBoxesByDate(date: string): Promise<CashBox[]>;
  getAllCashBoxes(): Promise<CashBox[]>;
  getCashBoxesBySessionId(sessionId: string): Promise<CashBox[]>;
  
  // Reconciliation Session operations
  createReconciliationSession(session: InsertReconciliationSession): Promise<ReconciliationSession>;
  getReconciliationSessionsByDate(date: string): Promise<ReconciliationSession[]>;
  getAllReconciliationSessions(): Promise<ReconciliationSession[]>;
  getReconciliationSessionById(id: string): Promise<ReconciliationSession | undefined>;
  
  // Complete reconciliation (session + cash boxes)
  createCompleteReconciliation(session: InsertReconciliationSession, cashBoxes: InsertCashBox[]): Promise<{
    session: ReconciliationSession;
    cashBoxes: CashBox[];
  }>;
  
  // Names management
  getSavedNames(type: 'worker' | 'auditor'): Promise<SavedName[]>;
  addSavedName(name: InsertSavedName): Promise<SavedName>;
  removeSavedName(id: string): Promise<void>;

  // Report management
  saveReport(reportData: InsertSavedReport): Promise<SavedReport>;
  getReportsBySession(sessionId: string): Promise<SavedReport[]>;
  getReportById(id: string): Promise<SavedReport | undefined>;
  deleteReport(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSavedNames(type: 'worker' | 'auditor'): Promise<SavedName[]> {
    return await db.select()
      .from(savedNames)
      .where(and(eq(savedNames.type, type), eq(savedNames.isActive, true)))
      .orderBy(savedNames.name);
  }

  async addSavedName(name: InsertSavedName): Promise<SavedName> {
    const [savedName] = await db
      .insert(savedNames)
      .values(name)
      .returning();
    return savedName;
  }

  async removeSavedName(id: string): Promise<void> {
    await db
      .update(savedNames)
      .set({ isActive: false })
      .where(eq(savedNames.id, id));
  }

  async createCashBox(insertCashBox: InsertCashBox): Promise<CashBox> {
    const [cashBox] = await db
      .insert(cashBoxes)
      .values(insertCashBox)
      .returning();
    return cashBox;
  }

  async getCashBoxesByDate(date: string): Promise<CashBox[]> {
    return await db.select()
      .from(cashBoxes)
      .where(eq(cashBoxes.date, date));
  }

  async getAllCashBoxes(): Promise<CashBox[]> {
    return await db.select().from(cashBoxes);
  }

  async createReconciliationSession(insertSession: InsertReconciliationSession): Promise<ReconciliationSession> {
    const [session] = await db
      .insert(reconciliationSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getReconciliationSessionsByDate(date: string): Promise<ReconciliationSession[]> {
    return await db.select()
      .from(reconciliationSessions)
      .where(eq(reconciliationSessions.sessionDate, date));
  }

  async getAllReconciliationSessions(): Promise<ReconciliationSession[]> {
    return await db.select().from(reconciliationSessions).orderBy(desc(reconciliationSessions.createdAt));
  }

  async getReconciliationSessionById(id: string): Promise<ReconciliationSession | undefined> {
    const [session] = await db.select()
      .from(reconciliationSessions)
      .where(eq(reconciliationSessions.id, id));
    return session || undefined;
  }

  async getCashBoxesBySessionId(sessionId: string): Promise<CashBox[]> {
    return await db.select()
      .from(cashBoxes)
      .where(eq(cashBoxes.sessionId, sessionId))
      .orderBy(cashBoxes.createdAt);
  }

  async createCompleteReconciliation(session: InsertReconciliationSession, cashBoxesData: InsertCashBox[]): Promise<{
    session: ReconciliationSession;
    cashBoxes: CashBox[];
  }> {
    // Create the reconciliation session first
    const [createdSession] = await db
      .insert(reconciliationSessions)
      .values(session)
      .returning();

    // Create all cash boxes linked to this session
    const createdCashBoxes = [];
    for (const cashBoxData of cashBoxesData) {
      const [cashBox] = await db
        .insert(cashBoxes)
        .values({ ...cashBoxData, sessionId: createdSession.id })
        .returning();
      createdCashBoxes.push(cashBox);
    }

    return {
      session: createdSession,
      cashBoxes: createdCashBoxes
    };
  }

  // Report management methods
  async saveReport(reportData: InsertSavedReport): Promise<SavedReport> {
    const [report] = await db.insert(savedReports).values(reportData).returning();
    return report;
  }

  async getReportsBySession(sessionId: string): Promise<SavedReport[]> {
    return await db.select().from(savedReports).where(eq(savedReports.sessionId, sessionId)).orderBy(savedReports.generatedAt);
  }

  async getReportById(id: string): Promise<SavedReport | undefined> {
    const [report] = await db.select().from(savedReports).where(eq(savedReports.id, id));
    return report || undefined;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(savedReports).where(eq(savedReports.id, id));
  }
}

export const storage = new DatabaseStorage();
