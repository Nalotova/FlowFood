/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CookingResult, MealType } from '../types/cooking';
import { FoodLogEntry } from '../types/foodLog';

export interface MealVarietyReport {
  score: number;
  warnings: string[];
  repeatedIngredients: string[];
  repeatedMealName?: boolean;
}

export function scoreMealVariety(
  newResult: CookingResult,
  recentMeals: { mealName: string; mealType: MealType; mainIngredients: string[] }[]
): MealVarietyReport {
  const warnings: string[] = [];
  const repeatedIngredients: string[] = [];
  let score = 100;
  let repeatedMealName = false;

  if (recentMeals.length === 0) {
    return { score, warnings, repeatedIngredients };
  }

  const latest = recentMeals[0];

  // 1. Check Meal Name
  if (latest.mealName === newResult.mealName && latest.mealType === newResult.mealType) {
    score -= 30;
    repeatedMealName = true;
    warnings.push(`Название блюда совпадает с предыдущим (${newResult.mealName}).`);
  }

  // 2. Check Ingredients Repetition
  const newIngredients = newResult.totalIngredients.map(i => i.foodName.toLowerCase());
  const latestIngredients = latest.mainIngredients.map(i => i.toLowerCase());

  const intersection = newIngredients.filter(i => 
    latestIngredients.some(li => i.includes(li) || li.includes(i))
  );

  if (intersection.length > 0) {
    repeatedIngredients.push(...intersection);
    if (intersection.length >= 2) {
      score -= 20;
      warnings.push(`Основные ингредиенты повторяются (${intersection.join(', ')}).`);
    }
  }

  // 3. Consecutive checks
  const sameFormatCount = recentMeals
    .filter(m => m.mealType === newResult.mealType)
    .slice(0, 3)
    .filter(m => {
       const isEggBased = (name: string) => /омлет|яичн|скрэмбл|яйц/i.test(name);
       return isEggBased(m.mealName) && isEggBased(newResult.mealName);
    }).length;

  if (sameFormatCount >= 3) {
    score -= 20;
    warnings.push("Похоже, это уже четвертый завтрак с яйцами подряд. Попробуйте сменить формат.");
  }

  return {
    score: Math.max(0, score),
    warnings,
    repeatedIngredients,
    repeatedMealName
  };
}
