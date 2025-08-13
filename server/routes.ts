import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCashBoxSchema, insertReconciliationSessionSchema, insertSavedNameSchema } from "@shared/schema";
import { z } from "zod";

const createCashBoxesSchema = z.object({
  cashBoxes: z.array(insertCashBoxSchema),
});

const createReconciliationSessionWithCashBoxesSchema = z.object({
  session: insertReconciliationSessionSchema,
  cashBoxes: z.array(insertCashBoxSchema),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create multiple cash boxes at once
  app.post("/api/cash-boxes", async (req, res) => {
    try {
      const { cashBoxes } = createCashBoxesSchema.parse(req.body);
      
      const createdCashBoxes = [];
      for (const cashBoxData of cashBoxes) {
        const cashBox = await storage.createCashBox(cashBoxData);
        createdCashBoxes.push(cashBox);
      }
      
      res.json(createdCashBoxes);
    } catch (error) {
      res.status(400).json({ message: "Invalid cash box data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get cash boxes by date
  app.get("/api/cash-boxes/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const cashBoxes = await storage.getCashBoxesByDate(date);
      res.json(cashBoxes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cash boxes", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all cash boxes
  app.get("/api/cash-boxes", async (req, res) => {
    try {
      const cashBoxes = await storage.getAllCashBoxes();
      res.json(cashBoxes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cash boxes", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create a complete reconciliation session with cash boxes
  app.post("/api/reconciliation", async (req, res) => {
    try {
      const { session, cashBoxes } = createReconciliationSessionWithCashBoxesSchema.parse(req.body);
      
      // Create the reconciliation session
      const createdSession = await storage.createReconciliationSession(session);
      
      // Create all cash boxes
      const createdCashBoxes = [];
      for (const cashBoxData of cashBoxes) {
        const cashBox = await storage.createCashBox(cashBoxData);
        createdCashBoxes.push(cashBox);
      }
      
      res.json({
        session: createdSession,
        cashBoxes: createdCashBoxes
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid reconciliation data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get reconciliation sessions by date
  app.get("/api/reconciliation/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const sessions = await storage.getReconciliationSessionsByDate(date);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reconciliation sessions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all reconciliation sessions
  app.get("/api/reconciliation", async (req, res) => {
    try {
      const sessions = await storage.getAllReconciliationSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reconciliation sessions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Names management routes
  // Get saved names by type
  app.get("/api/names/:type", async (req, res) => {
    try {
      const type = req.params.type as 'worker' | 'auditor';
      if (type !== 'worker' && type !== 'auditor') {
        return res.status(400).json({ message: "Type must be 'worker' or 'auditor'" });
      }
      const names = await storage.getSavedNames(type);
      res.json(names);
    } catch (error) {
      res.status(500).json({ message: "Error fetching names", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Add a new saved name
  app.post("/api/names", async (req, res) => {
    try {
      const nameData = insertSavedNameSchema.parse(req.body);
      const savedName = await storage.addSavedName(nameData);
      res.json(savedName);
    } catch (error) {
      res.status(400).json({ message: "Invalid name data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Remove a saved name (soft delete)
  app.delete("/api/names/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.removeSavedName(id);
      res.json({ message: "Name removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing name", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // History routes
  // Get all reconciliation sessions for history
  app.get("/api/history", async (req, res) => {
    try {
      const sessions = await storage.getAllReconciliationSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching history", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get specific reconciliation session with cash boxes
  app.get("/api/history/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await storage.getReconciliationSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Reconciliation session not found" });
      }

      const cashBoxes = await storage.getCashBoxesBySessionId(sessionId);
      
      res.json({
        session,
        cashBoxes
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching session details", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create complete reconciliation (session + cash boxes)
  app.post("/api/history/complete", async (req, res) => {
    try {
      const { session, cashBoxes } = req.body;
      
      const result = await storage.createCompleteReconciliation(session, cashBoxes);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Error creating complete reconciliation", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
