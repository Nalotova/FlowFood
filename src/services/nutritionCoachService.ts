/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAiModel } from './aiClient';
import { UserProfile } from '../types/profile';
import { FoodLogEntry } from '../types/foodLog';
import { FoodItem } from '../types/food';

export interface NutritionCoachAnalysis {
  statusText: string;
  exceededNutrients: string[];
  nearLimitNutrients: string[];
  missingNutrients: string[];
  nextMealRecommendation: string;
  suggestedDishes: {
    name: string;
    explanation: string;
    pfc: { kcal: number; protein: number; fat: number; carbs: number; };
    copyText: string;
  }[];
}

export const nutritionCoachService = {
  analyzeDay: async (
    profile: UserProfile,
    entries: FoodLogEntry[],
    fridgeItems: FoodItem[],
    nextMealType: string = 'dinner'
  ): Promise<NutritionCoachAnalysis> => {
    
    // Calculate current totals
    const consumed = entries.reduce((acc, entry) => ({
      kcal: acc.kcal + (entry.kcal || 0),
      protein: acc.protein + (entry.protein || 0),
      fat: acc.fat + (entry.fat || 0),
      carbs: acc.carbs + (entry.carbs || 0),
    }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

    // Identify targets
    const targets = {
      kcal: profile.dailyKcal || 0,
      protein: profile.proteinTarget || 0,
      fat: profile.fatTarget || 0,
      carbs: profile.carbTarget || 0,
    };

    const prompt = JSON.stringify({
      profile: {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        goal: profile.goal,
        allergies: profile.allergies,
        forbiddenFoods: profile.forbiddenFoods,
        likedFoods: profile.likedFoods,
        dislikedFoods: profile.dislikedFoods,
      },
      targets,
      consumed,
      remaining: {
        kcal: Math.max(0, targets.kcal - consumed.kcal),
        protein: Math.max(0, targets.protein - consumed.protein),
        fat: Math.max(0, targets.fat - consumed.fat),
        carbs: Math.max(0, targets.carbs - consumed.carbs),
      },
      mealsToday: entries.map(e => ({
        name: e.foodName,
        type: e.mealType || 'snack',
        kcal: e.kcal,
        pfc: { p: e.protein, f: e.fat, c: e.carbs }
      })),
      availableIngredients: fridgeItems
        .filter(i => i.amount > 0)
        .map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
      nextMealType
    }, null, 2);

    const systemInstruction = `
Ты — ИИ-нутрициолог. Твоя задача — проанализировать питание пользователя за день и дать рекомендации по следующему приёму пищи (${nextMealType}).

Правила:
1. Кратко оцени текущий статус: хватает ли калорий, белков, жиров, углеводов.
2. Укажи превышенные нутриенты, нутриенты близкие к лимиту (>90%) и недостающие.
3. Дай общую рекомендацию по составу следующего приёма пищи.
4. Предложи 1-3 блюда, которые можно приготовить из продуктов в холодильнике (availableIngredients), чтобы сбалансировать день.
5. Для каждого блюда укажи примерные КБЖУ.
6. В поле copyText напиши текст, который пользователь сможет вставить в запрос ИИ-повару (например: "Приготовь [Название блюда] из того что есть, акцент на белок").

Формат ответа JSON:
{
  "statusText": "string",
  "exceededNutrients": ["string"],
  "nearLimitNutrients": ["string"],
  "missingNutrients": ["string"],
  "nextMealRecommendation": "string",
  "suggestedDishes": [
    {
      "name": "string",
      "explanation": "string",
      "pfc": { "kcal": number, "protein": number, "fat": number, "carbs": number },
      "copyText": "string"
    }
  ]
}
`;

    const responseText = await callAiModel({
      prompt,
      systemInstruction,
      responseMimeType: "application/json"
    });

    return parseAiResponse(responseText);
  }
};

const parseAiResponse = (text: string): NutritionCoachAnalysis => {
  try {
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI coach response", text);
    return {
      statusText: "Не удалось провести анализ.",
      exceededNutrients: [],
      nearLimitNutrients: [],
      missingNutrients: [],
      nextMealRecommendation: "Пожалуйста, попробуйте позже.",
      suggestedDishes: []
    };
  }
};
