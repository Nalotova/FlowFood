import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/ai", async (req, res) => {
    const { prompt, images, systemInstruction, responseMimeType, modelName } = req.body;
    
    // Check multiple possible env vars
    let apiKey = process.env.GEMINI_API_KEY;
    let selectedKeySource = "GEMINI_API_KEY";
    
    if (!apiKey) {
      apiKey = process.env.API_KEY;
      selectedKeySource = "API_KEY";
    }
    if (!apiKey) {
      apiKey = process.env.GOOGLE_API_KEY;
      selectedKeySource = "GOOGLE_API_KEY";
    }
    if (!apiKey) {
      apiKey = process.env.GOOGLE_GENAI_API_KEY;
      selectedKeySource = "GOOGLE_GENAI_API_KEY";
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("AI endpoint called");
      console.log("Selected API key source:", selectedKeySource);
      console.log("Has GEMINI_API_KEY:", Boolean(process.env.GEMINI_API_KEY));
      console.log("Has API_KEY:", Boolean(process.env.API_KEY));
      console.log("Has GOOGLE_API_KEY:", Boolean(process.env.GOOGLE_API_KEY));
      console.log("Has GOOGLE_GENAI_API_KEY:", Boolean(process.env.GOOGLE_GENAI_API_KEY));
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "AI key is not configured on the server",
        details: "Set GEMINI_API_KEY or API_KEY in the server environment."
      });
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [{ text: prompt }];

      if (images && Array.isArray(images)) {
        images.forEach((base64: string) => {
          const mimeType = base64.match(/data:([^;]+);base64,/)?.[1] || "image/jpeg";
          const data = base64.replace(/^data:[^;]+;base64,/, "");
          parts.push({
            inlineData: {
              data,
              mimeType
            }
          });
        });
      }

      const response = await ai.models.generateContent({
        model: modelName || process.env.GEMINI_MODEL_NAME || "gemini-3-flash-preview",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: responseMimeType || "text/plain"
        }
      });
      res.json({ text: response.text || "" });
    } catch (error) {
      console.error("AI endpoint failed:", error);
      res.status(500).json({ error: "AI request failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
