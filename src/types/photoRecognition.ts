import { FoodCategory, FoodState } from './food';

export interface PhotoRecognitionInput {
  images: string[]; // base64 or data URLs
  userHint?: string;
}

export interface RecognizedFoodDraft {
  name?: string | null;
  brand?: string | null;
  packageAmount?: number | null;
  packageUnit?: "g" | "kg" | "ml" | "l" | "piece" | "package" | null;
  gramsPerUnit?: number | null;
  kcalPer100g?: number | null;
  proteinPer100g?: number | null;
  fatPer100g?: number | null;
  carbsPer100g?: number | null;
  categories?: FoodCategory[];
  state?: FoodState;
  source: "photo_ocr";
  confidenceScore?: number;
  notes?: string;
  warnings: string[];
  amount?: number | null;
  unit?: "g" | "kg" | "ml" | "l" | "piece" | "package" | null;
}

export interface PhotoRecognitionResult {
  status: "success" | "partial" | "failed";
  draft?: RecognizedFoodDraft;
  rawText?: string;
  warnings: string[];
  confidenceScore?: number;
}
