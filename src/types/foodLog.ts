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
