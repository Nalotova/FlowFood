/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

export interface AiCallInput {
  prompt: string;
  images?: string[]; // base64 strings
  systemInstruction?: string;
  responseMimeType?: string;
}

export const callAiModel = async (input: AiCallInput, attempts = 2): Promise<string> => {
  const { prompt, images, systemInstruction, responseMimeType = "text/plain" } = input;
  
  // Use process.env.GEMINI_API_KEY as explicitly required by the gemini-api skill for React (Vite)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not available in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-3-flash-preview";

  try {
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
      model: modelName,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction,
        responseMimeType,
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error(`AI Call failed (attempts remaining: ${attempts}):`, error);
    
    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callAiModel(input, attempts - 1);
    }
    throw error;
  }
};
