/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { callAiModel } from './aiClient';
import { ChefChatMessage, ChefChatResponse } from '../types/chefChat';
import { CookingResult, UserProfile, FoodItem, FoodLogEntry } from '../types';

const SYSTEM_INSTRUCTION = `Ты — семейный ИИ-шеф и нутриционный помощник внутри приложения питания.

Ты видишь текущее меню, участников, их цели, холодильник и историю диалога.

Пользователь может:
1. задать вопрос;
2. попросить объяснить меню;
3. попросить улучшить вкус/сытость;
4. попросить изменить меню.

Если пользователь просто спрашивает (например: "нормально ли это?", "почему столько углеводов?", "как сделать вкуснее?", "подходит ли это под цель?"), верни status = "answer" и текстовый ответ в поле message. proposedResult должен быть null.

Если пользователь явно просит изменить меню (например: "убери гречку", "сделай больше белка", "замени яйца", "сделай другой вариант", "не хочу сладкое", "сделай сытнее"), верни status = "revision" и новый CookingResult в поле proposedResult. В поле message кратко объясни изменения.

Правила revision:
- Не применяй изменения сам.
- Верни новый вариант CookingResult в proposedResult.
- Используй только продукты из холодильника (availableFoodItems).
- Не превышай остатки (amount).
- Учитывай цели участников (дневные ккал, ккал на приём, БЖУ).
- Учитывай словесные цели (nutritionGoalText) и стиль питания (dietStyleNotes).
- Сохраняй выбранных участников и mealType.
- Старайся держать калории и БЖУ в допустимом диапазоне.
- Добавь рецепт приготовления в поле recipe.
- Все порции должны быть реалистичными.
- Продукты в штуках — только целыми числами.

Формат ответа строго JSON:
{
  "status": "answer" | "revision" | "error",
  "message": "Текст ответа или краткое описание изменений",
  "proposedResult": null или объект CookingResult,
  "warnings": ["Список предупреждений если есть"]
}

Если status = "revision", proposedResult должен содержать:
- mealName: название блюда
- mealIdea: краткая идея
- sections: { portions, totalIngredients, inventoryAfter, targetInfo, explanation, recipe }
И другие обязательные поля CookingResult.
ВАЖНО: source должен оставаться "ai".
`;

export const chefChatService = {
  sendChefChatMessage: async ({
    message,
    chatHistory,
    currentResult,
    profiles,
    foodItems,
    foodLogEntries = []
  }: {
    message: string;
    chatHistory: ChefChatMessage[];
    currentResult: CookingResult;
    profiles: UserProfile[];
    foodItems: FoodItem[];
    foodLogEntries?: FoodLogEntry[];
  }): Promise<ChefChatResponse> => {
    // Context preparation
    const context = {
      currentPlan: currentResult,
      participants: profiles.filter(p => currentResult.portions.some(pr => pr.profileId === p.id)),
      // Reduce context size by picking only necessary fields and limiting items
      availableFoodItems: foodItems
        .filter(f => f.amount > 0)
        .map(f => ({ id: f.id, name: f.name, amount: f.amount, unit: f.unit })),
      recentFoodLogEntries: foodLogEntries
        .filter(e => e.date === new Date().toISOString().split('T')[0])
        .slice(-10),
      chatHistory: chatHistory.slice(-5).map(h => ({ role: h.role, content: h.content })),
      mealType: currentResult.mealType
    };

    const prompt = `Сообщение от пользователя: "${message}"

Контекст:
${JSON.stringify(context, null, 2)}
`;

    try {
      const responseText = await callAiModel({
        prompt,
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      });

      // Safer parsing
      let jsonStr = responseText.trim();
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }
      
      const response = JSON.parse(jsonStr) as ChefChatResponse;
      return response;
    } catch (error) {
      console.error("Chef chat service failed:", error);
      return {
        status: "error",
        message: "Произошла ошибка при обращении к ИИ-шефу. Попробуйте еще раз."
      };
    }
  }
};
