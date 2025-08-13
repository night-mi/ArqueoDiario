import { type CashBox, type InsertCashBox, type ReconciliationSession, type InsertReconciliationSession, type SavedName, type InsertSavedName } from "@shared/schema";
import { db } from "./db";
import { savedNames, cashBoxes, reconciliationSessions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Cash Box operations
  createCashBox(cashBox: InsertCashBox): Promise<CashBox>;
  getCashBoxesByDate(date: string): Promise<CashBox[]>;
  getAllCashBoxes(): Promise<CashBox[]>;
  
  // Reconciliation Session operations
  createReconciliationSession(session: InsertReconciliationSession): Promise<ReconciliationSession>;
  getReconciliationSessionsByDate(date: string): Promise<ReconciliationSession[]>;
  getAllReconciliationSessions(): Promise<ReconciliationSession[]>;
  
  // Names management
  getSavedNames(type: 'worker' | 'auditor'): Promise<SavedName[]>;
  addSavedName(name: InsertSavedName): Promise<SavedName>;
  removeSavedName(id: string): Promise<void>;
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
      .where(eq(reconciliationSessions.date, date));
  }

  async getAllReconciliationSessions(): Promise<ReconciliationSession[]> {
    return await db.select().from(reconciliationSessions);
  }
}

export const storage = new DatabaseStorage();
