/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAiModel } from './aiClient';
import { UserProfile, FoodItem, MealType } from '../types';
import { DishFeasibility } from '../types/dishPlanning';

const SYSTEM_INSTRUCTION = `Ты — семейный ИИ-шеф.

Пользователь может попросить конкретное блюдо, например: борщ, плов, омлет, суп, паста, салат, запеканка.

Твоя задача:
1. Понять, что это за блюдо.
2. Разложить его на типичные ингредиенты для указанного количества участников (selectedProfiles.length).
3. Разделить ингредиенты на обязательные (required), желательные (recommended) и опциональные (optional).
4. Сравнить с продуктами в холодильнике (foodItems).
5. Определить статус:
   - "can_make": можно приготовить из текущих продуктов.
   - "can_make_modified": можно приготовить упрощённую или альтернативную версию (например, без одного recommended ингредиента или с заменой).
   - "needs_shopping": для нормального или минимального варианта нужно докупить продукты.
   - "cannot_make": критически не хватает базовых продуктов.
6. Не выдумывай, что продукт есть в холодильнике, если его нет.
7. Если продукт можно заменить (substitutable), предложи замену из имеющихся (например, индейка вместо курицы).
8. Вернуть результат только в формате JSON.
9. Все текстовые поля (dishName, message, note, warnings) — на русском языке.

Используй роли для ингредиентов: base, protein, vegetable, carb, fat, flavor, spice, topping.

Формат JSON:
{
  "status": "can_make" | "can_make_modified" | "needs_shopping" | "cannot_make",
  "dishName": "Название блюда",
  "message": "Краткое пояснение",
  "availableIngredients": [
    {
      "requiredIngredient": { "name": "...", "importance": "...", "role": "..." },
      "status": "available",
      "matchedFoodItemId": "...",
      "matchedFoodName": "...",
      "availableAmount": 0,
      "note": "..."
    }
  ],
  "missingIngredients": [
    {
      "requiredIngredient": { "name": "...", "importance": "...", "role": "...", "possibleSubstitutes": ["..."] },
      "status": "missing",
      "note": "..."
    }
  ],
  "suggestedSubstitutions": [
    {
      "requiredIngredient": { "name": "...", "importance": "...", "role": "..." },
      "status": "substitutable",
      "substituteFoodItemId": "...",
      "substituteFoodName": "...",
      "note": "..."
    }
  ],
  "shoppingList": [
    {
      "name": "Название",
      "importance": "required | recommended | optional",
      "amount": 0,
      "unit": "ед. изм."
    }
  ],
  "warnings": []
}
`;

export const dishPlanningService = {
  analyzeRequestedDish: async (params: {
    requestedDish: string;
    selectedProfiles: UserProfile[];
    foodItems: FoodItem[];
    mealType: MealType;
    userComment?: string;
  }): Promise<DishFeasibility> => {
    const { requestedDish, selectedProfiles, foodItems, mealType, userComment } = params;

    const context = {
      requestedDish,
      mealType,
      userComment,
      participantsCount: selectedProfiles.length,
      householdFridge: foodItems.map(f => ({
        id: f.id,
        name: f.name,
        amount: f.amount,
        unit: f.unit
      }))
    };

    const prompt = `Проанализируй возможность приготовления следующего блюда:
${JSON.stringify(context, null, 2)}
`;

    try {
      const responseText = await callAiModel({
        prompt,
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      });

      // Safer parsing for AI markdown blocks
      let jsonStr = responseText.trim();
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      return JSON.parse(jsonStr) as DishFeasibility;
    } catch (error) {
      console.error("Dish planning analysis failed:", error);
      return {
        status: "cannot_make",
        dishName: requestedDish,
        message: "Не удалось проанализировать блюдо из-за технической ошибки.",
        availableIngredients: [],
        missingIngredients: [],
        suggestedSubstitutions: [],
        shoppingList: [],
        warnings: ["Ошибка связи с ИИ-шефом"]
      };
    }
  }
};
