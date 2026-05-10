/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CookingResult, MealPortion, IngredientAmount, InventoryMovement } from '../types/cooking';
import { FoodItem } from '../types/food';
import { calculateFoodNutrition, getFoodWeightInGrams } from './nutrition';

export const recalculateCookingResultFromPortions = (
  result: CookingResult,
  foodItems: FoodItem[]
): CookingResult => {
  const updatedPortions: MealPortion[] = result.portions.map(portion => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    const updatedItems = portion.items.map(item => {
      const food = foodItems.find(f => f.id === item.foodItemId);
      if (!food) return item;

      const nutrition = calculateFoodNutrition(food, item.amount);
      const grams = getFoodWeightInGrams(food, item.amount);

      totalKcal += nutrition.kcal;
      totalProtein += nutrition.protein;
      totalFat += nutrition.fat;
      totalCarbs += nutrition.carbs;

      return {
        ...item,
        grams,
        ...nutrition
      };
    });

    return {
      ...portion,
      items: updatedItems,
      actualKcal: Math.round(totalKcal),
      totals: {
        kcal: Math.round(totalKcal),
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
      }
    };
  });

  // Calculate totalIngredients
  const totalIngredientsMap = new Map<string, { 
    id: string; 
    name: string; 
    amount: number; 
    unit: string;
    totalGrams: number;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }>();

  updatedPortions.forEach(portion => {
    portion.items.forEach(item => {
      const existing = totalIngredientsMap.get(item.foodItemId);
      if (existing) {
        existing.amount += item.amount;
        existing.totalGrams += item.grams;
        existing.kcal += item.kcal;
        existing.protein += item.protein;
        existing.fat += item.fat;
        existing.carbs += item.carbs;
      } else {
        totalIngredientsMap.set(item.foodItemId, {
          id: item.foodItemId,
          name: item.foodName,
          amount: item.amount,
          unit: item.unit,
          totalGrams: item.grams,
          kcal: item.kcal,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs
        });
      }
    });
  });

  const totalIngredients: IngredientAmount[] = Array.from(totalIngredientsMap.values()).map(ing => ({
    foodItemId: ing.id,
    foodName: ing.name,
    totalAmount: ing.amount,
    unit: ing.unit,
    totalGrams: Math.round(ing.totalGrams),
    kcal: Math.round(ing.kcal),
    protein: Math.round(ing.protein * 10) / 10,
    fat: Math.round(ing.fat * 10) / 10,
    carbs: Math.round(ing.carbs * 10) / 10
  }));

  // Calculate inventoryAfter
  const inventoryAfter: InventoryMovement[] = foodItems.map(food => {
    const used = totalIngredientsMap.get(food.id)?.amount || 0;
    return {
      foodItemId: food.id,
      foodName: food.name,
      currentAmount: food.amount,
      usedAmount: used,
      remainingAmount: Math.max(0, food.amount - used),
      unit: food.unit
    };
  });

  // Add manual edit warning if not already present
  const manualWarning = "Результат был вручную отредактирован";
  const updatedWarnings = result.warnings.includes(manualWarning) 
    ? result.warnings 
    : [...result.warnings, manualWarning];

  return {
    ...result,
    portions: updatedPortions,
    totalIngredients,
    inventoryAfter,
    source: "manual",
    warnings: updatedWarnings
  };
};
