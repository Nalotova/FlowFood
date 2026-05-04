/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAiModel } from './aiClient';
import { PhotoRecognitionInput } from '../types/photoRecognition';

export interface FoodEstimationResult {
  status: "success" | "partial" | "failed";
  foodName: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  weightGrams?: number;
  confidenceScore: number;
  notes: string;
  warnings: string[];
}

const SYSTEM_INSTRUCTION = `Ты — эксперт по оценке пищевой ценности блюд по фотографиям.

Твоя задача: определить, что изображено на фото, оценить примерный вес и рассчитать КБЖУ.

Правила:
1. Возвращай только JSON.
2. Не добавляй текст вне JSON.
3. Оценивай вес порции максимально реалистично.
4. Если на фото несколько блюд, суммируй их.
5. Интерфейс приложения русский, поэтому notes и warnings возвращай на русском.
6. Указывай confidenceScore от 0 до 1.

Пример JSON:
{
  "status": "success",
  "foodName": "Гречка с курицей и овощным салатом",
  "kcal": 450,
  "protein": 35,
  "fat": 15,
  "carbs": 45,
  "weightGrams": 350,
  "confidenceScore": 0.85,
  "notes": "Оценка на основе типичного состава блюда такой порции",
  "warnings": ["Вес оценен приблизительно", "Соус может содержать скрытые жиры"]
}`;

export const estimateFoodFromPhotos = async (input: PhotoRecognitionInput): Promise<FoodEstimationResult> => {
  const prompt = `Оцени пищевую ценность блюда на этих фото. ${input.userHint ? `Дополнительная информация: ${input.userHint}` : ''}`;

  try {
    let responseText = await callAiModel({
      prompt,
      images: input.images,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    });

    // Remove markdown codeblock from response text if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    return JSON.parse(responseText) as FoodEstimationResult;
  } catch (error) {
    console.error("Food estimation service failed:", error);
    return {
      status: "failed",
      foodName: "Не удалось определить",
      kcal: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      confidenceScore: 0,
      notes: "Ошибка при обращении к ИИ",
      warnings: [`Произошла ошибка: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
};
