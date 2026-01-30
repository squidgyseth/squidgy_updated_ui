import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { analyzeWebsite, captureScreenshot, getFavicon } from "./routes/website";
import { createSubaccountAndUser } from "./routes/ghl";
import agentsRouter from "./routes/agents";
import storageProxyRouter from "./routes/storage-proxy";
import googleCalendarRouter from "./routes/googleCalendar";
import knowledgeBaseRouter from "./routes/knowledge-base-router";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/demo", handleDemo);

  // Website analysis routes
  app.post("/website/full-analysis", analyzeWebsite);
  app.post("/website/screenshot", captureScreenshot);
  app.post("/website/favicon", getFavicon);

  // GHL integration routes
  app.post("/ghl/create-subaccount-and-user", createSubaccountAndUser);

  // Agent management routes
  app.use("/agents", agentsRouter);

  // Storage proxy routes (for masking Supabase URLs)
  app.use("/storage", storageProxyRouter);

  // Google Calendar integration routes
  app.use("/api/google/calendar", googleCalendarRouter);

  // Knowledge base routes (Neon database queries)
  app.use("/api/knowledge-base", knowledgeBaseRouter);

  return app;
}
