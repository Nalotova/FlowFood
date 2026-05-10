/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MealType, CookingResult } from './cooking';

export type UserRole = "adult" | "teen" | "child" | "guest" | "other";
export type Gender = "female" | "male" | "other" | "not_specified";
export type MealSize = "small" | "normal" | "large";
export type DataSource = 'Firebase' | 'Local Storage' | 'API';

export interface HistoryItem {
  id: string;
  date: string;
  mealType: MealType;
  result: CookingResult;
}

export interface MealDistribution {
  breakfast?: number;
  lunch?: number;
  snack?: number;
  dinner?: number;
}

export interface PreferredMealSize {
  breakfast?: MealSize;
  lunch?: MealSize;
  snack?: MealSize;
  dinner?: MealSize;
}

export interface ProteinSettings {
  mode: "manual" | "auto" | "not_tracked";
  proteinTargetGrams?: number;
  proteinPerKg?: number;
  bodyWeightKg?: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  age?: number;
  gender?: Gender;
  role?: UserRole;
  isActive: boolean;
  dataSource: DataSource;

  // Nutrition settings
  dailyKcal?: number;
  trainingDayKcal?: number;
  restDayKcal?: number;
  goal?: string;
  proteinTarget?: number; // Kept for backward compatibility
  proteinSettings?: ProteinSettings;
  fatTarget?: number;
  carbTarget?: number;

  nutritionTargets?: {
    proteinMode: "not_tracked" | "manual" | "per_kg";
    proteinGrams?: number;
    bodyWeightKg?: number;
    proteinPerKg?: number;

    fatMode: "not_tracked" | "manual" | "range" | "percent";
    fatGrams?: number;
    fatMinGrams?: number;
    fatMaxGrams?: number;
    fatPercent?: number;

    carbMode: "not_tracked" | "manual" | "range" | "remaining";
    carbGrams?: number;
    carbMinGrams?: number;
    carbMaxGrams?: number;
  };

  // Meal distribution
  mealDistribution: MealDistribution;

  // Preferences
  preferences: string[];
  likedFoods: string[];
  dislikedFoods: string[];
  forbiddenFoods: string[];
  allergies: string[];
  notes?: string;

  // Portion settings
  portionMultiplier: number;
  preferredMealSize?: PreferredMealSize;

  // Cooking behavior
  usuallyEatsTogether: boolean;
  allowSameDishDifferentPortion: boolean;
  allowSeparateDish: boolean;
}
