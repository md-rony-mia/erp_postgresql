import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { apiRouter } from "./src/server/routes.ts";
import { setupRealtime } from "./src/server/realtime.ts";
import { createReportEngineApp } from "./src/server/reportEngine.ts";

dotenv.config();

// Defense-in-depth: every async route is wrapped (see src/server/routes.ts), but this
// keeps a stray unhandled rejection anywhere else from taking the whole process down.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Postgres-backed data/auth/branch-stock/error-log API (replaces Firestore)
app.use("/api", apiRouter);

// jsreport-powered report engine (replaces the old window.print()-only RDL builder).
// Mounted as an isolated sub-app so jsreport's internal routes never collide with /api above.
const { app: reportEngineApp, ready: reportEngineReady } = createReportEngineApp();
app.use("/jsreport", reportEngineApp);
reportEngineReady
  .then(() => console.log("jsreport report engine ready at /jsreport"))
  .catch(() => console.warn("jsreport report engine failed to start — PDF/Excel export from the Reports module will not work until this is fixed"));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: process.env.AI_FEATURE_ENABLED === "true"
  });
});

// Gemini proxy endpoint to protect key
app.post("/api/gemini/generate", async (req, res) => {
  try {
    if (process.env.AI_FEATURE_ENABLED !== "true") {
      return res.status(503).json({ error: "AI features are currently disabled by the administrator." });
    }

    const { prompt, systemInstruction, tools, contents } = req.body;
    if (!prompt && !contents) {
      return res.status(400).json({ error: "Prompt or contents is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
      return res.status(503).json({ error: "AI service temporarily unavailable (API Key missing)" });
    }

    // Determine the contents payload
    const contentsPayload = contents || prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: systemInstruction || "You are Nexova ERP AI assistant. Help the user optimize business operations.",
        tools: tools || undefined,
      },
    });

    // Extract function calls if present
    const functionCalls = response.functionCalls || [];

    if (functionCalls.length > 0) {
      res.json({ functionCalls });
    } else {
      res.json({ text: response.text || "No response received from AI model." });
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  setupRealtime(httpServer);
}

startServer();
