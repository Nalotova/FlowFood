/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from './profile';
import { FoodItem } from './food';
import { FoodLogEntry } from './foodLog';

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export type CookingMode = "same_dish_different_portions" | "separate_dishes";

export type TargetStrategy = "planned_meal_kcal" | "adapt_to_remaining_day";

export type GenerationMode = "ai";

export type CookingResultSource = "ai" | "ai_fallback" | "manual";

export interface CookingValidationReport {
  isValid: boolean;
  targetDeviationWarnings: string[];
  inventoryWarnings: string[];
  forbiddenFoodWarnings: string[];
  generalWarnings: string[];
}

export interface CookingRequest {
  id: string;
  mealType: MealType;
  mode: CookingMode;
  targetStrategy: TargetStrategy;
  participantIds: string[];
  preferredFoodIds: string[];
  excludedFoodIds: string[];
  userComment?: string;
  createdAt: string;
}

export interface MealTargetInfo {
  profileId: string;
  profileName: string;
  dailyKcal?: number;
  plannedMealKcal: number;
  consumedTodayKcal: number;
  remainingDayKcal?: number;
  targetMealKcal: number;
  portionMultiplier: number;
  proteinTarget?: number;
  proteinMin?: number;
  proteinMax?: number;
  fatTarget?: number;
  fatMin?: number;
  fatMax?: number;
  carbTarget?: number;
  carbMin?: number;
  carbMax?: number;
}

export interface IngredientAmount {
  foodItemId: string;
  foodName: string;
  totalAmount: number;
  unit: string;
  totalGrams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MealPortionItem {
  foodItemId: string;
  foodName: string;
  amount: number;
  unit: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MealPortion {
  profileId: string;
  profileName: string;
  targetKcal: number;
  actualKcal: number;
  items: MealPortionItem[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface InventoryMovement {
  foodItemId: string;
  foodName: string;
  currentAmount: number;
  usedAmount: number;
  remainingAmount: number;
  unit: string;
}

export interface RecipeInstruction {
  title: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  steps: string[];
  servingNotes?: string[];
  portioningNotes?: string[];
  tasteNotes?: string[];
  warnings?: string[];
}

export interface CookingRevisionRequest {
  currentResult: CookingResult;
  userMessage: string;
  profiles: UserProfile[];
  foodItems: FoodItem[];
  foodLogEntries?: FoodLogEntry[];
}

export interface CookingRevision {
  id: string;
  userMessage: string;
  result: CookingResult;
  createdAt: string;
}

export interface CookingResult {
  id: string;
  mealName: string;
  mealIdea?: string;
  mealType: MealType;
  mode: CookingMode;
  targetStrategy: TargetStrategy;
  source: CookingResultSource;
  targetInfo: MealTargetInfo[];
  portions: MealPortion[];
  totalIngredients: IngredientAmount[];
  inventoryAfter: InventoryMovement[];
  validationReport?: CookingValidationReport;
  warnings: string[];
  explanation?: string;
  recipe?: RecipeInstruction;
  revisionHistory?: CookingRevision[];
  createdAt: string;
}
