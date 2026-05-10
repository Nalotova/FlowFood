/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AiCallInput {
  prompt: string;
  images?: string[]; // base64 strings
  systemInstruction?: string;
  responseMimeType?: string;
}

export const callAiModel = async (input: AiCallInput, attempts = 2): Promise<string> => {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...input,
        modelName: import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-3-flash-preview"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error(`AI Call failed (attempts remaining: ${attempts}):`, error);

    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callAiModel(input, attempts - 1);
    }

    throw error;
  }
};
