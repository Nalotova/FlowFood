/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CookingResult, CookingValidationReport } from '../types/cooking';
import { FoodItem } from '../types/food';
import { UserProfile } from '../types/profile';

export const getTargetDeviationPercent = (targetKcal: number, actualKcal: number): number => {
  if (targetKcal === 0) return 0;
  return Math.abs(((actualKcal - targetKcal) / targetKcal) * 100);
};

export const validateCookingResult = (
  result: CookingResult,
  foodItems: FoodItem[],
  profiles: UserProfile[]
): CookingValidationReport => {
  const targetDeviationWarnings: string[] = [];
  const inventoryWarnings: string[] = [];
  const forbiddenFoodWarnings: string[] = [];
  const generalWarnings: string[] = [];

  // 1. Calorie Deviation
  result.portions.forEach(portion => {
    const deviation = getTargetDeviationPercent(portion.targetKcal, portion.actualKcal);
    if (deviation > 15) {
      targetDeviationWarnings.push(
        `Отклонение калорий для ${portion.profileName}: ${Math.round(deviation)}% (${portion.actualKcal} vs ${portion.targetKcal})`
      );
    }

    // Macro Validation
    const targetInfo = result.targetInfo?.find(t => t.profileId === portion.profileId);
    if (targetInfo) {
      if (targetInfo.proteinMin && portion.totals.protein < targetInfo.proteinMin) {
        generalWarnings.push(`Белка меньше целевого минимума для ${portion.profileName} (${portion.totals.protein}г < ${targetInfo.proteinMin}г)`);
      }
      if (targetInfo.fatMax && portion.totals.fat > targetInfo.fatMax) {
        generalWarnings.push(`Жиров больше целевого диапазона для ${portion.profileName} (${portion.totals.fat}г > ${targetInfo.fatMax}г)`);
      }
      if (targetInfo.carbMax && portion.totals.carbs > targetInfo.carbMax) {
        generalWarnings.push(`Углеводов больше целевого диапазона для ${portion.profileName} (${portion.totals.carbs}г > ${targetInfo.carbMax}г)`);
      }
    }
  });

  // 2. Inventory Check
  result.totalIngredients.forEach(ing => {
    const food = foodItems.find(f => f.id === ing.foodItemId);
    const used = ing.totalAmount;
    if (!food) {
      inventoryWarnings.push(`Продукт ${ing.foodName} не найден в холодильнике`);
    } else if (used > food.amount) {
      inventoryWarnings.push(`Недостаточно ${food.name}: нужно ${used}, есть ${food.amount}`);
    }
  });

  // 3. Forbidden Food Check
  result.portions.forEach(portion => {
    const profile = profiles.find(p => p.id === portion.profileId);
    if (profile) {
      const forbidden = profile.forbiddenFoods || [];
      const allergies = profile.allergies || [];
      const allRestrictions = [...forbidden, ...allergies];

      portion.items.forEach(item => {
        const isForbidden = allRestrictions.some(r => 
          item.foodName.toLowerCase().includes(r.toLowerCase())
        );
        if (isForbidden) {
          forbiddenFoodWarnings.push(`Продукт ${item.foodName} может содержать аллергены для ${profile.name}`);
        }
      });
    }
  });

  // 4. Empty Portions
  if (result.portions.length === 0) {
    generalWarnings.push("Результат не содержит порций");
  } else {
    result.portions.forEach(p => {
      if (p.items.length === 0) {
        generalWarnings.push(`Порция для ${p.profileName} пуста`);
      }
    });
  }

  const isValid = inventoryWarnings.length === 0;

  return {
    isValid,
    targetDeviationWarnings,
    inventoryWarnings,
    forbiddenFoodWarnings,
    generalWarnings
  };
};

export const hasInventoryProblems = (report: CookingValidationReport): boolean => {
  return report.inventoryWarnings.length > 0;
};
