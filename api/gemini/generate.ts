import type { IncomingMessage, ServerResponse } from "http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Simple in-memory rate limiter for serverless
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .slice(0, 10000);
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { json: (data: any) => void; status: (code: number) => any }
) {
  // CORS headers
  const origin = process.env.APP_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    if (typeof res.status === "function") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    const sendJson = (statusCode: number, payload: any) => {
      if (typeof res.status === "function") {
        return res.status(statusCode).json(payload);
      }
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    };
    return sendJson(429, { error: "Rate limit exceeded. Please try again later." });
  }

  const sendJson = (statusCode: number, payload: any) => {
    if (typeof res.status === "function") {
      return res.status(statusCode).json(payload);
    }
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  };

  try {
    if (process.env.AI_FEATURE_ENABLED !== "true") {
      return sendJson(503, { error: "AI features are currently disabled by the administrator." });
    }

    let body = req.body;
    if (!body && (req as any).readable) {
      const buffers: Uint8Array[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString("utf-8");
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = {};
        }
      }
    }

    const { prompt, systemInstruction, tools, contents } = body || {};
    const safePrompt = sanitizeInput(prompt || contents);

    if (!safePrompt || safePrompt.trim().length === 0) {
      return sendJson(400, { error: "Prompt or contents is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
      return sendJson(503, { error: "AI service temporarily unavailable (API Key missing)" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: safePrompt,
      config: {
        systemInstruction:
          sanitizeInput(systemInstruction) || "You are Nexova ERP AI assistant. Help the user optimize business operations.",
        tools: tools || undefined,
      },
    });

    const functionCalls = response.functionCalls || [];

    if (functionCalls.length > 0) {
      return sendJson(200, { functionCalls });
    } else {
      return sendJson(200, { text: response.text || "No response received from AI model." });
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return sendJson(500, { error: "AI service temporarily unavailable" });
  }
}
