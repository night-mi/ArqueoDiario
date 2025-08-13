import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCashBoxSchema, insertReconciliationSessionSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
