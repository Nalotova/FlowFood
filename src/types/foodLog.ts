/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FoodLogType = "planned_meal" | "unplanned_snack" | "manual_entry";

export interface FoodLogEntry {
  id: string;
  profileId: string;
  profileName: string;
  date: string; // ISO string (YYYY-MM-DD)
  type: FoodLogType;
  mealType?: "breakfast" | "lunch" | "snack" | "dinner";
  foodItemId?: string;
  foodName: string;
  amount: number;
  unit: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  subtractFromFridge: boolean;
  notes?: string;
  createdAt: string;
  sourceCookingResultId?: string;
  sourceCookingResultSnapshot?: {
    mealName: string;
    mealIdea?: string;
    explanation?: string;
    recipe?: {
      steps: string[];
      tasteNotes?: string[];
      warnings?: string[];
    };
    totalIngredients?: {
      foodName: string;
      totalAmount: number;
      unit: string;
    }[];
    portionItems?: {
      foodName: string;
      amount: number;
      unit: string;
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
    }[];
    warnings?: string[];
  };
}

export interface DailyNutritionSummary {
  profileId: string;
  date: string;
  targetKcal?: number;
  consumedKcal: number;
  remainingKcal?: number;
  protein: number;
  fat: number;
  carbs: number;
}
