/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export const getAiClient = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       console.warn("GEMINI_API_KEY is not defined. AI functionality will be limited.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiInstance;
};

export interface AiCallInput {
  prompt: string;
  images?: string[]; // base64 strings
  systemInstruction?: string;
  responseMimeType?: string;
}

export const callAiModel = async (input: AiCallInput): Promise<string> => {
  const ai = getAiClient();
  const { prompt, images, systemInstruction, responseMimeType = "application/json" } = input;
  
  try {
    const parts: any[] = [{ text: prompt }];
    
    if (images && images.length > 0) {
      images.forEach(base64 => {
        // Extract mime type if present, default to image/jpeg
        const mimeType = base64.match(/data:([^;]+);base64,/)?.[1] || "image/jpeg";
        const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseMimeType,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Call failed:", error);
    throw error;
  }
};
