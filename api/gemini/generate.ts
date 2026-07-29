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

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { json: (data: any) => void; status: (code: number) => any }
) {
  if (req.method !== "POST") {
    if (typeof res.status === "function") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
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
    if (!prompt && !contents) {
      return sendJson(400, { error: "Prompt or contents is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
      return sendJson(503, { error: "AI service temporarily unavailable (API Key missing)" });
    }

    const contentsPayload = contents || prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction:
          systemInstruction || "You are Nexova ERP AI assistant. Help the user optimize business operations.",
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
