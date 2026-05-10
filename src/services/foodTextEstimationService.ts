/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAiModel } from './aiClient';

export interface TextFoodEstimationItem {
  id: string;
  name: string;
  originalText?: string;
  amount: number;
  unit: "g" | "kg" | "ml" | "l" | "piece" | "package";
  estimatedGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  warnings: string[];
}

export interface TextFoodEstimationResult {
  status: "success" | "partial" | "failed";
  mealName: string;
  items: TextFoodEstimationItem[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    grams: number;
  };
  notes: string;
  warnings: string[];
}

const SYSTEM_INSTRUCTION = `
Ты — помощник для расчёта КБЖУ съеденной еды по текстовому описанию.
Пользователь пишет обычным языком, что он съел.
Твоя задача — разобрать текст на отдельные продукты, определить количество/вес и оценить КБЖУ.

Правила:
- Возвращай только JSON.
- Не добавляй текст вне JSON.
- Интерфейс русский, поэтому notes/warnings на русском.
- Для базовых общеизвестных продуктов используй типовые значения КБЖУ из надежных справочников (на 100г).
- Если пользователь указал сухой вес (например, "овсянка сухая 40 г"), считай именно сухой вес.
- Если масло указано отдельно, считай его отдельным продуктом.
- Если блюдо "жареное", но масло не указано, добавь warning: "Масло не указано, калорийность может быть выше".
- Если вес не указан, но продукт счётный ("2 яйца"), оцени граммы типично: 1 яйцо ≈ 50-55 г.
- Если продукт неоднозначный или брендовый без данных, ставь confidence = "low" и needsReview = true.
- Округляй kcal до целых, БЖУ до 0.1 г.

Формат ответа строго JSON:
{
  "status": "success" | "partial" | "failed",
  "mealName": "string",
  "items": [
    {
      "id": "string (random stable unique)",
      "name": "string",
      "originalText": "string",
      "amount": 0,
      "unit": "g | kg | ml | l | piece | package",
      "estimatedGrams": 0,
      "kcalPer100g": 0,
      "proteinPer100g": 0,
      "fatPer100g": 0,
      "carbsPer100g": 0,
      "kcal": 0,
      "protein": 0,
      "fat": 0,
      "carbs": 0,
      "confidence": "high | medium | low",
      "needsReview": false,
      "warnings": []
    }
  ],
  "totals": {
    "kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0,
    "grams": 0
  },
  "notes": "короткое резюме разбора",
  "warnings": []
}
`;

export const estimateFoodFromText = async (text: string): Promise<TextFoodEstimationResult> => {
  try {
    const response = await callAiModel({
      prompt: `Разбери следующий текст о съеденной еде и оцени КБЖУ: \n"${text}"`,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    });

    if (!response) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown blocks if AI ignored mime-type
    let cleanText = response.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const result = JSON.parse(cleanText) as TextFoodEstimationResult;

    // Basic validation of the result structure
    if (!result.status || !Array.isArray(result.items)) {
      throw new Error("Invalid result structure from AI");
    }

    return result;
  } catch (error) {
    console.error("[TextFoodEstimation] Error:", error);
    return {
      status: "failed",
      mealName: "Eaten Food",
      items: [],
      totals: { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 },
      notes: "Ошибка разбора текста",
      warnings: [error instanceof Error ? error.message : "Internal Error"]
    };
  }
};
