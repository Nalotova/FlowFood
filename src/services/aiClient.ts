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
  const { prompt, images, systemInstruction, responseMimeType = "application/json" } = input;
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-2.0-flash";
  const customApiKey = localStorage.getItem('custom_gemini_api_key') || undefined;

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        images,
        systemInstruction,
        responseMimeType,
        modelName,
        apiKey: customApiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "";
  } catch (error: any) {
    console.error(`AI Call failed (attempts remaining: ${attempts}):`, error);
    
    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callAiModel(input, attempts - 1);
    }
    throw error;
  }
};
