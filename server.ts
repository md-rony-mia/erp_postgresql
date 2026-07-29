import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security middleware

app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com"],
      frameAncestors: ["'self'", "https://*.run.app", "https://aistudio.google.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Please try again later." },
});

app.use('/api/', apiLimiter);
app.use('/api/gemini/', aiLimiter);

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
    aiEnabled: process.env.AI_FEATURE_ENABLED === "true",
    timestamp: new Date().toISOString(),
  });
});

// Input sanitization helper
function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .slice(0, 10000); // Max 10KB prompt
}

// Gemini proxy endpoint to protect key
app.post("/api/gemini/generate", async (req, res) => {
  try {
    if (process.env.AI_FEATURE_ENABLED !== "true") {
      return res.status(503).json({ error: "AI features are currently disabled by the administrator." });
    }

    const { prompt, systemInstruction, tools, contents } = req.body;
    const safePrompt = sanitizeInput(prompt || contents);

    if (!safePrompt || safePrompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt or contents is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
      return res.status(503).json({ error: "AI service temporarily unavailable (API Key missing)" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: safePrompt,
      config: {
        systemInstruction: sanitizeInput(systemInstruction) || "You are Nexova ERP AI assistant. Help the user optimize business operations.",
        tools: tools || undefined,
      },
    });

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

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
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
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ Nexova ERP Server running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   AI Features: ${process.env.AI_FEATURE_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Rate Limiting: ENABLED`);
    console.log(`   Helmet Security: ENABLED\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
