import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // AI Proxy Route
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, images, systemInstruction, responseMimeType, modelName } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const parts: any[] = [{ text: prompt }];
      
      if (images && images.length > 0) {
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
        model: modelName || "gemini-2.0-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
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
