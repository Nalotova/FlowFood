import { FoodCategory, FoodState, FoodUnit, FoodSource } from './food';

export interface FridgeAiInput {
  text: string;
  images?: string[]; // base64/dataURL
  existingFoodItems: { id: string; name: string }[];
}

export interface ParsedFridgeItemDraft {
  tempId: string;
  name: string;
  brand?: string | null;
  amount: number | null;
  unit: FoodUnit | null;
  gramsPerUnit?: number | null;
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  categories: FoodCategory[];
  state: FoodState;
  source: FoodSource;
  confidenceScore: number;
  nutritionConfidence: "high" | "medium" | "low";
  needsReview: boolean;
  notes?: string;
  warnings: string[];
  matchedExistingFoodItemId?: string | null;
}

export interface ParseFridgeAiResult {
  status: "success" | "partial" | "failed";
  items: ParsedFridgeItemDraft[];
  warnings: string[];
  rawText?: string;
}
