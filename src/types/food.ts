/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FoodUnit = "g" | "kg" | "ml" | "l" | "piece" | "package";

export type FoodCategory = 
  | "protein" 
  | "carb" 
  | "fat" 
  | "vegetable" 
  | "fruit" 
  | "dairy" 
  | "fish" 
  | "meat" 
  | "egg" 
  | "grain" 
  | "ready_meal" 
  | "other";

export type FoodState = "raw" | "cooked" | "dry" | "frozen" | "ready";

export type FoodSource = "manual" | "photo_ocr" | "barcode" | "recipe" | "database" | "ai_text" | "ai_text_photo";

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  amount: number;
  unit: FoodUnit;
  gramsPerUnit?: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  categories: FoodCategory[];
  state: FoodState;
  source: FoodSource;
  confidenceScore?: number;
  expirationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
