/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodItem, UserProfile } from '../types';

export const getFoodWeightInGrams = (item: FoodItem, amount?: number): number => {
  const val = amount !== undefined ? amount : item.amount;
  switch (item.unit) {
    case 'g': return val;
    case 'kg': return val * 1000;
    case 'ml': return val; // Assumption: 1ml = 1g
    case 'l': return val * 1000;
    case 'piece':
    case 'package':
      return val * (item.gramsPerUnit || 0);
    default: return val;
  }
};

export const calculateFoodNutrition = (item: FoodItem, amount?: number) => {
  const weight = getFoodWeightInGrams(item, amount);
  return {
    kcal: Math.round((weight / 100) * item.kcalPer100g),
    protein: Math.round((weight / 100) * item.proteinPer100g * 10) / 10,
    fat: Math.round((weight / 100) * item.fatPer100g * 10) / 10,
    carbs: Math.round((weight / 100) * item.carbsPer100g * 10) / 10,
  };
};

export const formatNutritionValue = (val: number) => {
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
};

export const calculateProteinTarget = (profile: UserProfile): number | null => {
  const settings = profile.proteinSettings;
  if (!settings || settings.mode === 'not_tracked') return null;

  if (settings.mode === 'manual' && settings.proteinTargetGrams) {
    return settings.proteinTargetGrams;
  }

  if (settings.mode === 'auto' && settings.bodyWeightKg && settings.proteinPerKg) {
    return Math.round(settings.bodyWeightKg * settings.proteinPerKg);
  }

  // Fallback to old field for backward compatibility
  if (profile.proteinTarget) return profile.proteinTarget;

  return null;
};

export const formatProteinTarget = (profile: UserProfile): string => {
  const settings = profile.proteinSettings;
  if (!settings || settings.mode === 'not_tracked') return 'Белок не отслеживается';

  const target = calculateProteinTarget(profile);
  if (target === null) return 'Белок: не настроен';

  if (settings.mode === 'manual') {
    return `Белок: ${target} г/день`;
  }

  if (settings.mode === 'auto') {
    return `Белок: ${target} г/день (вес ${settings.bodyWeightKg} кг × ${settings.proteinPerKg} г/кг)`;
  }

  return `Белок: ${target} г/день`;
};

export const sumMealPortionItems = (items: { foodItemId: string, amount: number }[], allFood: FoodItem[]) => {
  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  items.forEach(item => {
    const food = allFood.find(f => f.id === item.foodItemId);
    if (food) {
      const nutrition = calculateFoodNutrition(food, item.amount);
      totalKcal += nutrition.kcal;
      totalProtein += nutrition.protein;
      totalFat += nutrition.fat;
      totalCarbs += nutrition.carbs;
    }
  });

  return {
    kcal: Math.round(totalKcal),
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
  };
};
