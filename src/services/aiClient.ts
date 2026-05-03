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

export const callAiModel = async (input: AiCallInput, attempts = 2): Promise<string> => {
  const ai = getAiClient();
  const { prompt, images, systemInstruction, responseMimeType = "application/json" } = input;
  
  try {
    const parts: any[] = [{ text: prompt }];
    
    if (images && images.length > 0) {
      images.forEach(base64 => {
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

    const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-2.0-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseMimeType,
      },
    });

    return response.text || "";
  } catch (error: any) {
    console.error(`AI Call failed (attempts remaining: ${attempts}):`, error);
    
    // Check for 404 or model error
    if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('model not found')) {
      throw new Error("Модель ИИ недоступна. Проверьте настройки модели в окружении (VITE_GEMINI_MODEL_NAME).");
    }

    if (attempts > 0) {
      // Wait bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callAiModel(input, attempts - 1);
    }
    throw error;
  }
};
