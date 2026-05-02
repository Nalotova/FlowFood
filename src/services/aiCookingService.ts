/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CookingRequest, 
  UserProfile, 
  FoodItem, 
  FoodLogEntry, 
  CookingResult, 
  MealTargetInfo,
  MealPortion,
  IngredientAmount,
  InventoryMovement,
  MealPortionItem
} from '../types';
import { calculateFoodNutrition, sumMealPortionItems, getFoodWeightInGrams } from '../utils/nutrition';
import { callAiModel } from './aiClient';

interface AiPortionItem {
  foodItemId: string;
  foodName: string;
  amount: number;
  unit: string;
}

interface AiPortion {
  profileId: string;
  profileName: string;
  targetKcal: number;
  items: AiPortionItem[];
}

interface AiResponse {
  status: "success" | "needs_more_food" | "error";
  mealName: string;
  mealIdea?: string;
  explanation: string;
  warnings: string[];
  portions: AiPortion[];
  recipe?: {
    title: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    totalTimeMinutes?: number;
    steps: string[];
    servingNotes?: string[];
    portioningNotes?: string[];
    tasteNotes?: string[];
    warnings?: string[];
  };
}

export const aiCookingService = {
  generateAiCookingPlan: async ({
    request,
    profiles,
    foodItems,
    foodLogEntries = [],
    targetInfo
  }: {
    request: CookingRequest;
    profiles: UserProfile[];
    foodItems: FoodItem[];
    foodLogEntries?: FoodLogEntry[];
    targetInfo: MealTargetInfo[];
  }): Promise<CookingResult> => {
    
    // 1. Build prompt
    const prompt = buildCookingPrompt(request, profiles, foodItems, foodLogEntries, targetInfo);
    const systemInstruction = getSystemInstruction();

    // 2. Call AI
    const responseText = await callAiModel({ 
      prompt, 
      systemInstruction,
      responseMimeType: "application/json"
    });
    
    // 3. Parse and Validate
    const aiData = parseAiCookingResponse(responseText);
    const validatedData = fixAndValidateAiResponse(aiData, foodItems);
    validateAiCookingResponse(validatedData, foodItems, targetInfo);

    // 4. Transform and Recalculate (Recalculate nutrition using our own logic)
    return normalizeAndRecalculate(validatedData, request, foodItems, targetInfo);
  },

  refineAiCookingPlan: async ({
    previousResult,
    userMessage,
    profiles,
    foodItems,
    targetInfo
  }: {
    previousResult: CookingResult;
    userMessage: string;
    profiles: UserProfile[];
    foodItems: FoodItem[];
    targetInfo: MealTargetInfo[];
  }): Promise<CookingResult> => {
    // 1. Build refinement prompt
    const prompt = JSON.stringify({
      context: "Refining a previous meal plan",
      previousPlan: {
        mealName: previousResult.mealName,
        portions: previousResult.portions.map(p => ({
          profileName: p.profileName,
          items: p.items.map(i => ({ foodName: i.foodName, amount: i.amount, unit: i.unit }))
        }))
      },
      userFeedback: userMessage,
      participants: targetInfo.map(info => {
        const p = profiles.find(profile => profile.id === info.profileId)!;
        return {
          profileId: p.id,
          name: p.name,
          targetMealKcal: info.targetMealKcal,
          allergies: p.allergies || [],
          forbiddenFoods: p.forbiddenFoods || []
        };
      }),
      availableFoodItems: foodItems
        .filter(f => f.amount > 0)
        .map(f => ({
          id: f.id,
          name: f.name,
          amount: f.amount,
          unit: f.unit
        }))
    }, null, 2);

    const systemInstruction = getSystemInstruction() + "\nИсправь приём пищи согласно пожеланиям пользователя, сохраняя формат JSON и правила.";

    // 2. Call AI
    const responseText = await callAiModel({ 
      prompt, 
      systemInstruction,
      responseMimeType: "application/json"
    });
    
    // 3. Parse and Validate
    const aiData = parseAiCookingResponse(responseText);
    const validatedData = fixAndValidateAiResponse(aiData, foodItems);
    validateAiCookingResponse(validatedData, foodItems, targetInfo);

    // 4. Transform - we use a dummy request since we are refining
    const dummyRequest: CookingRequest = {
      id: previousResult.id,
      mealType: previousResult.mealType,
      mode: previousResult.mode,
      targetStrategy: previousResult.targetStrategy,
      participantIds: targetInfo.map(t => t.profileId),
      preferredFoodIds: [],
      excludedFoodIds: [],
      createdAt: previousResult.createdAt
    };

    return normalizeAndRecalculate(validatedData, dummyRequest, foodItems, targetInfo);
  }
};

const getSystemInstruction = () => `
Ты — семейный ИИ-повар и нутрициолог.
Твоя задача — не просто попасть в калории и БЖУ, а сделать блюдо, которое человеку реально приятно съесть.

Жёсткие правила:
1. Используй только продукты из списка availableFoodItems.
2. Не используй продукты из excludedFoodIds.
3. Не превышай остатки продуктов (amount в availableFoodItems). Это критически важно!
4. ИСПОЛЬЗУЙ ТЕ ЖЕ ЕДИНИЦЫ ИЗМЕРЕНИЯ (unit), что указаны для продукта в availableFoodItems. Например: 'g', 'kg', 'ml', 'l', 'piece', 'package'. Если у огурцов стоит 'piece', пиши количество в штуках (например 0.5), а не в граммах.
5. Учитывай allergies и forbiddenFoods как строгие запреты.
6. Учитывай dislikedFoods как мягкое ограничение.
7. Для режима same_dish_different_portions используй один общий набор продуктов для всех, но разные граммы.
8. Для режима separate_dishes можно давать разные блюда по участникам.
9. Попадай в targetMealKcal каждого участника примерно ±15%.
10. Учитывай macroTargets участников (белки, жиры, углеводы), если они заданы. Белок имеет высокий приоритет. Если задан proteinMin, старайся достичь его, даже если калории немного отклонятся.
11. Не придумывай новые продукты.
12. В поле "foodItemId" ОБЯЗАТЕЛЬНО записывай "id" продукта из списка availableFoodItems. Это критически важно!
13. Не предлагай абсурдные порции (например, 2г картошки).
14. В поле "recipe" ВСЕГДА пиши пошаговый рецепт приготовления.

Философия питания:
- Простая домашняя еда, но вкусная.
- Контролируемые калории без ощущения "наказания" или "диетической грусти".
- Еда должна давать сытость и физически, и психологически.
- Если можно добавить вкус без роста калорий (специи, зелень, лимон, чеснок) — предлагай это в tasteNotes.
- Не повторяй один и тот же формат завтрака (например, омлет) слишком часто, если в recentMeals он уже был.

Формат ответа строго JSON:
{
  "status": "success" | "needs_more_food" | "error",
  "mealName": "string",
  "mealIdea": "string", // Короткая аппетитная идея блюда
  "explanation": "string", // Общее описание
  "warnings": ["string"],
  "portions": [
    {
      "profileId": "string",
      "profileName": "string",
      "targetKcal": number,
      "items": [
        {
          "foodItemId": "string",
          "foodName": "string",
          "amount": number,
          "unit": "string"
        }
      ]
    }
  ],
  "recipe": {
    "title": "string",
    "steps": ["string"],
    "tasteNotes": ["string"]
  }
}
`;

const buildCookingPrompt = (
  request: CookingRequest, 
  profiles: UserProfile[], 
  foodItems: FoodItem[],
  foodLogEntries: FoodLogEntry[],
  targetInfo: MealTargetInfo[]
) => {
  const participants = targetInfo.map(info => {
    const p = profiles.find(profile => profile.id === info.profileId)!;
    return {
      profileId: p.id,
      name: p.name,
      role: p.role,
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
      dailyKcal: info.dailyKcal,
      consumedTodayKcal: info.consumedTodayKcal,
      remainingDayKcal: info.remainingDayKcal,
      likedFoods: p.likedFoods || [],
      dislikedFoods: p.dislikedFoods || [],
      forbiddenFoods: p.forbiddenFoods || [],
      allergies: p.allergies || [],
      portionMultiplier: info.portionMultiplier
    };
  });

  const availableFoodItems = foodItems
    .filter(f => f.amount > 0 && !request.excludedFoodIds.includes(f.id))
    .map(f => ({
      id: f.id,
      name: f.name,
      amount: f.amount,
      unit: f.unit,
      gramsPerUnit: f.gramsPerUnit,
      kcalPer100g: f.kcalPer100g,
      proteinPer100g: f.proteinPer100g,
      fatPer100g: f.fatPer100g,
      carbsPer100g: f.carbsPer100g,
      categories: f.categories || []
    }));

  const recentMeals = foodLogEntries
    .filter(e => e.type === 'planned_meal')
    .slice(-5)
    .map(e => ({
      date: e.date,
      mealType: e.mealType,
      mealName: e.foodName,
      mainIngredients: [] // We don't store ingredients separately in log yet
    }));

  return JSON.stringify({
    mealType: request.mealType,
    mode: request.mode,
    targetStrategy: request.targetStrategy,
    userComment: request.userComment,
    recentMeals,
    participants,
    availableFoodItems,
    preferredFoodIds: request.preferredFoodIds,
    excludedFoodIds: request.excludedFoodIds
  }, null, 2);
};

const parseAiCookingResponse = (text: string): AiResponse => {
  try {
    // Basic cleanup in case AI added markdown blocks or leading/trailing text
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }
    
    // Sometimes AI might start with some text and then JSON
    if (jsonStr.indexOf('{') > 0) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
    }
    if (jsonStr.lastIndexOf('}') < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    throw new Error("AI returned invalid JSON structure");
  }
};

/**
 * Attempts to fix common AI mistakes like missing IDs or slightly wrong names
 */
const fixAndValidateAiResponse = (data: AiResponse, availableItems: FoodItem[]): AiResponse => {
  if (!data.portions || !Array.isArray(data.portions)) return data;

  const totalUsedById = new Map<string, number>();

  data.portions.forEach(portion => {
    if (!portion.items || !Array.isArray(portion.items)) return;

    portion.items.forEach((item: any) => {
      // 1. Find product
      let found = availableItems.find(f => f.id === item.foodItemId);
      if (!found && item.foodName) {
        found = availableItems.find(f => f.name.toLowerCase() === (item.foodName || '').toLowerCase());
      }
      if (!found && item.foodName) {
        found = availableItems.find(f => 
          f.name.toLowerCase().includes(item.foodName.toLowerCase()) || 
          item.foodName.toLowerCase().includes(f.name.toLowerCase())
        );
      }

      if (found) {
        item.foodItemId = found.id;
        item.foodName = found.name;
        
        // 2. Fix units if AI made a mistake (e.g., sent grams instead of pieces)
        if (found.unit === 'piece' && (item.unit === 'г' || item.unit === 'grams' || item.unit === 'g') && item.amount >= 20) {
          const gramsPerUnit = found.gramsPerUnit || 150; // default for a veg
          item.amount = Number((item.amount / gramsPerUnit).toFixed(2));
          item.unit = 'piece';
        } else if (item.unit !== found.unit) {
          item.unit = found.unit;
        }

        // 3. Track total use for capping
        const currentUsed = totalUsedById.get(found.id) || 0;
        totalUsedById.set(found.id, currentUsed + item.amount);
      }
    });
  });

  // 4. Capping: If total use exceeds available, reduce proportionally
  totalUsedById.forEach((total, id) => {
    const food = availableItems.find(f => f.id === id)!;
    if (total > food.amount) {
      const ratio = food.amount / total;
      data.portions.forEach(p => {
        if (!p.items) return;
        p.items.forEach(item => {
          if (item.foodItemId === id) {
            item.amount = Number((item.amount * ratio).toFixed(2));
          }
        });
      });
    }
  });

  return data;
};

const validateAiCookingResponse = (data: AiResponse, foodItems: FoodItem[], targetInfo: MealTargetInfo[]) => {
  if (data.status === 'error') {
     throw new Error(data.explanation || "AI could not generate a plan");
  }

  if (!data.portions || !Array.isArray(data.portions)) {
    throw new Error("Invalid structure: portions missing");
  }

  // Check food items existence and limits
  const totalUsed = new Map<string, number>();
  
  for (const portion of data.portions) {
    if (!portion.items) continue;
    for (const item of portion.items) {
      const food = foodItems.find(f => f.id === item.foodItemId);
      if (!food) {
        throw new Error(`AI suggested unknown item: ${item.foodName} (${item.foodItemId})`);
      }
      const current = totalUsed.get(item.foodItemId) || 0;
      totalUsed.set(item.foodItemId, current + item.amount);
    }
  }

  for (const [id, used] of totalUsed.entries()) {
    const food = foodItems.find(f => f.id === id)!;
    // Allow for small rounding errors (0.01)
    if (used > food.amount + 0.01) {
      throw new Error(`AI exceeded available amount for ${food.name}: ${used} > ${food.amount}`);
    }
  }
};

const normalizeAndRecalculate = (
  aiData: AiResponse, 
  request: CookingRequest, 
  foodItems: FoodItem[],
  targetInfo: MealTargetInfo[]
): CookingResult => {
  const portions: MealPortion[] = aiData.portions.map(aiPortion => {
    const portionItems: MealPortionItem[] = aiPortion.items.map(item => {
      const food = foodItems.find(f => f.id === item.foodItemId)!;
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
      items: portionItems as any, // Type cast for simplicity due to slight interface mismatch in imports
      totals
    };
  });

  // Calculate total ingredients
  const totalUsedMap = new Map<string, number>();
  portions.forEach(p => {
    p.items.forEach((item: any) => {
      const current = totalUsedMap.get(item.foodItemId) || 0;
      totalUsedMap.set(item.foodItemId, current + item.amount);
    });
  });

  const totalIngredients: IngredientAmount[] = [];
  const inventoryAfter: InventoryMovement[] = [];

  totalUsedMap.forEach((usedAmount, foodId) => {
    const food = foodItems.find(f => f.id === foodId)!;
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
    mealType: request.mealType,
    mode: request.mode,
    targetStrategy: request.targetStrategy,
    source: "ai",
    targetInfo,
    portions,
    totalIngredients,
    inventoryAfter,
    warnings: aiData.warnings || [],
    explanation: aiData.explanation,
    recipe: aiData.recipe,
    createdAt: new Date().toISOString()
  };
};
