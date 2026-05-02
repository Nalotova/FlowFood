/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CookingResult, 
  UserProfile, 
  FoodItem, 
  FoodLogEntry, 
  CookingRevisionRequest,
  RecipeInstruction,
  MealPortion,
  IngredientAmount,
  InventoryMovement,
  MealPortionItem,
  MealTargetInfo
} from '../types';
import { calculateFoodNutrition, sumMealPortionItems, getFoodWeightInGrams } from '../utils/nutrition';
import { callAiModel } from './aiClient';

interface AiRevisionResponse {
  status: "success" | "partial" | "failed";
  mealName: string;
  mealIdea?: string;
  explanation: string;
  warnings: string[];
  portions: {
    profileId: string;
    profileName: string;
    targetKcal: number;
    items: {
      foodItemId: string;
      foodName: string;
      amount: number;
      unit: string;
    }[];
  }[];
  recipe: RecipeInstruction;
}

export const cookingRevisionService = {
  reviseCookingResultWithAi: async (params: CookingRevisionRequest): Promise<CookingResult> => {
    const { currentResult, userMessage, profiles, foodItems, foodLogEntries = [] } = params;

    // 1. Build prompt
    const prompt = buildCookingRevisionPrompt(params);
    const systemInstruction = getRevisionSystemInstruction();

    // 2. Call AI
    const responseText = await callAiModel({ 
      prompt, 
      systemInstruction,
      responseMimeType: "application/json"
    });
    
    // 3. Parse and Validate
    const aiData = parseCookingRevisionResponse(responseText);
    validateCookingRevisionResponse(aiData, foodItems, currentResult.targetInfo);

    // 4. Normalize and Recalculate
    const revisedResult = normalizeRevisedCookingResult(aiData, currentResult, foodItems);

    // 5. Update revision history
    const revision = {
      id: Math.random().toString(36).substr(2, 9),
      userMessage,
      result: { ...currentResult, revisionHistory: undefined }, // avoid deep nesting
      createdAt: new Date().toISOString()
    };

    return {
      ...revisedResult,
      revisionHistory: [
        ...(currentResult.revisionHistory || []),
        revision
      ]
    };
  }
};

function getRevisionSystemInstruction() {
  return `
Ты — ИИ-повар в семейном приложении для планирования еды.

Пользователь хочет изменить уже сгенерированный расчёт блюда.
Твоя задача — не просто поменять граммы, а сделать блюдо вкусным и соответствующим пожеланиям.

Еда должна:
- Иметь понятную кулинарную идею.
- Быть сытной и психологически приятной.
- Не быть "диетической грустью".
- Если можно добавить вкус без роста калорий (специи, лимон, чеснок) — предлагай это в tasteNotes.

Правила:
1. Используй только продукты из холодильника (availableFoodItems).
2. Не используй продукты, которые пользователь попросил убрать.
3. Не превышай остатки продуктов (amount в availableFoodItems).
4. Сохраняй mealType и участников.
5. Старайся держать калории каждого участника в пределах ±15% от targetKcal.
6. Учитывай macroTargets. Белок имеет высокий приоритет.
7. Продукты в штуках (unit: piece/package) должны быть только целыми числами.
8. Обязательно добавь подробный рецепт в поле "recipe".

Формат ответа строго JSON:
{
  "status": "success" | "partial" | "failed",
  "mealName": "string",
  "mealIdea": "string", 
  "explanation": "string",
  "warnings": ["string"],
  "portions": [...],
  "recipe": {
    "title": "string",
    "steps": ["string"],
    "tasteNotes": ["string"],
    ...
  }
}
`;
}

function buildCookingRevisionPrompt(params: CookingRevisionRequest) {
  const { currentResult, userMessage, profiles, foodItems, foodLogEntries = [] } = params;

    const participants = currentResult.targetInfo.map(info => {
    const p = profiles.find(profile => profile.id === info.profileId)!;
    return {
      profileId: p.id,
      name: p.name,
      targetMealKcal: info.targetMealKcal,
      macroTargets: {
        proteinTarget: info.proteinTarget,
        proteinMin: info.proteinMin,
        proteinMax: info.proteinMax,
        fatTarget: info.fatTarget,
        fatMin: info.fatMin,
        fatMax: info.fatMax,
        carbTarget: info.carbTarget,
        carbMin: info.carbMin,
        carbMax: info.carbMax
      },
      allergies: p.allergies || [],
      forbiddenFoods: p.forbiddenFoods || [],
      dislikedFoods: p.dislikedFoods || []
    };
  });

  const availableFoodItems = foodItems
    .filter(f => f.amount > 0)
    .map(f => ({
      id: f.id,
      name: f.name,
      amount: f.amount,
      unit: f.unit,
      kcalPer100g: f.kcalPer100g
    }));

  const recentMeals = foodLogEntries
    .filter(e => e.type === 'planned_meal')
    .slice(-5)
    .map(e => ({
      date: e.date,
      mealType: e.mealType,
      mealName: e.foodName,
      mainIngredients: []
    }));

  return JSON.stringify({
    context: "Refining a previous meal plan",
    recentMeals,
    currentPlan: {
      mealName: currentResult.mealName,
      mealType: currentResult.mealType,
      portions: currentResult.portions.map(p => ({
        profileName: p.profileName,
        items: p.items.map(i => ({ 
          foodItemId: i.foodItemId,
          foodName: i.foodName, 
          amount: i.amount, 
          unit: i.unit 
        }))
      }))
    },
    userMessage,
    participants,
    availableFoodItems
  }, null, 2);
}

function parseCookingRevisionResponse(text: string): AiRevisionResponse {
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error("AI returned invalid JSON");
  }
}

function validateCookingRevisionResponse(data: AiRevisionResponse, foodItems: FoodItem[], targetInfo: MealTargetInfo[]) {
  if (data.status === 'failed') {
    throw new Error(data.explanation || "AI could not refine the plan");
  }

  if (!data.portions || !Array.isArray(data.portions)) {
    throw new Error("Invalid structure: portions missing");
  }

  const totalUsed = new Map<string, number>();
  for (const portion of data.portions) {
    if (!portion.items) continue;
    for (const item of portion.items) {
      const food = foodItems.find(f => f.id === item.foodItemId);
      if (!food) continue; // AI might hallucinate ID but we catch it in normalization
      const current = totalUsed.get(item.foodItemId) || 0;
      totalUsed.set(item.foodItemId, current + item.amount);
    }
  }

  for (const [id, used] of totalUsed.entries()) {
    const food = foodItems.find(f => f.id === id)!;
    if (used > food.amount) {
      throw new Error(`AI exceeded available amount for ${food.name}: ${used} > ${food.amount}`);
    }
  }
}

function normalizeRevisedCookingResult(
  aiData: AiRevisionResponse, 
  currentResult: CookingResult, 
  foodItems: FoodItem[]
): CookingResult {
  const portions: MealPortion[] = aiData.portions.map(aiPortion => {
    const portionItems: MealPortionItem[] = aiPortion.items.map(item => {
      const food = foodItems.find(f => f.id === item.foodItemId) || foodItems[0]; // fallback
      const grams = getFoodWeightInGrams(food, item.amount);
      const nutrition = calculateFoodNutrition(food, item.amount);
      
      return {
        foodItemId: item.foodItemId,
        foodName: food.name,
        amount: item.amount,
        unit: food.unit,
        grams,
        ...nutrition
      };
    });

    const totals = sumMealPortionItems(aiPortion.items, foodItems);
    
    return {
      profileId: aiPortion.profileId,
      profileName: aiPortion.profileName,
      targetKcal: aiPortion.targetKcal,
      actualKcal: totals.kcal,
      items: portionItems,
      totals
    };
  });

  const totalUsedMap = new Map<string, number>();
  portions.forEach(p => {
    p.items.forEach(item => {
      const current = totalUsedMap.get(item.foodItemId) || 0;
      totalUsedMap.set(item.foodItemId, current + item.amount);
    });
  });

  const totalIngredients: IngredientAmount[] = [];
  const inventoryAfter: InventoryMovement[] = [];

  totalUsedMap.forEach((usedAmount, foodId) => {
    const food = foodItems.find(f => f.id === foodId);
    if (!food) return;

    const nutrition = calculateFoodNutrition(food, usedAmount);
    const totalGrams = getFoodWeightInGrams(food, usedAmount);

    totalIngredients.push({
      foodItemId: foodId,
      foodName: food.name,
      totalAmount: usedAmount,
      totalGrams,
      unit: food.unit,
      ...nutrition
    });

    inventoryAfter.push({
      foodItemId: foodId,
      foodName: food.name,
      currentAmount: food.amount,
      usedAmount,
      remainingAmount: Math.max(0, food.amount - usedAmount),
      unit: food.unit
    });
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    mealName: aiData.mealName,
    mealIdea: aiData.mealIdea,
    mealType: currentResult.mealType,
    mode: currentResult.mode,
    targetStrategy: currentResult.targetStrategy,
    source: "ai",
    targetInfo: currentResult.targetInfo,
    portions,
    totalIngredients,
    inventoryAfter,
    warnings: aiData.warnings || [],
    explanation: aiData.explanation,
    recipe: aiData.recipe,
    createdAt: new Date().toISOString()
  };
}
