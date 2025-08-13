import { type CashBox, type InsertCashBox, type ReconciliationSession, type InsertReconciliationSession } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private cashBoxes: Map<string, CashBox>;
  private reconciliationSessions: Map<string, ReconciliationSession>;

  constructor() {
    this.cashBoxes = new Map();
    this.reconciliationSessions = new Map();
  }

  async createCashBox(insertCashBox: InsertCashBox): Promise<CashBox> {
    const id = randomUUID();
    const cashBox: CashBox = { ...insertCashBox, id };
    this.cashBoxes.set(id, cashBox);
    return cashBox;
  }

  async getCashBoxesByDate(date: string): Promise<CashBox[]> {
    return Array.from(this.cashBoxes.values()).filter(
      (cashBox) => cashBox.date === date
    );
  }

  async getAllCashBoxes(): Promise<CashBox[]> {
    return Array.from(this.cashBoxes.values());
  }

  async createReconciliationSession(insertSession: InsertReconciliationSession): Promise<ReconciliationSession> {
    const id = randomUUID();
    const session: ReconciliationSession = { 
      ...insertSession, 
      id,
      createdAt: new Date().toISOString()
    };
    this.reconciliationSessions.set(id, session);
    return session;
  }

  async getReconciliationSessionsByDate(date: string): Promise<ReconciliationSession[]> {
    return Array.from(this.reconciliationSessions.values()).filter(
      (session) => session.date === date
    );
  }

  async getAllReconciliationSessions(): Promise<ReconciliationSession[]> {
    return Array.from(this.reconciliationSessions.values());
  }
}

export const storage = new MemStorage();
