/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedFridgeItemDraft } from '../types/fridgeAi';
import { RecognizedFoodDraft } from '../types/photoRecognition';
import { FoodUnit, FoodCategory, FoodState, FoodSource } from '../types/food';

/**
 * Normalizes a parsed fridge item draft from AI to ensure no null values are passed to form controls.
 */
export function normalizeParsedFoodDraft(draft: any, tempId?: string): ParsedFridgeItemDraft {
  const safeTempId = tempId || draft?.tempId || crypto.randomUUID();
  
  if (!draft) {
    return {
      tempId: safeTempId,
      name: "",
      brand: "",
      amount: 0,
      unit: "g",
      gramsPerUnit: undefined,
      kcalPer100g: 0,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbsPer100g: 0,
      categories: ["other"],
      state: "ready",
      source: "manual",
      confidenceScore: 0,
      nutritionConfidence: "low",
      needsReview: true,
      notes: "",
      warnings: [],
      matchedExistingFoodItemId: undefined,
    };
  }

  return {
    tempId: safeTempId,
    name: draft.name ?? "",
    brand: draft.brand ?? "",
    amount: draft.amount ?? 0,
    unit: (draft.unit as FoodUnit) ?? "g",
    gramsPerUnit: draft.gramsPerUnit ?? undefined,
    kcalPer100g: draft.kcalPer100g ?? 0,
    proteinPer100g: draft.proteinPer100g ?? 0,
    fatPer100g: draft.fatPer100g ?? 0,
    carbsPer100g: draft.carbsPer100g ?? 0,
    categories: Array.isArray(draft.categories) && draft.categories.length > 0 ? draft.categories : ["other"],
    state: (draft.state as FoodState) ?? "ready",
    source: (draft.source as FoodSource) ?? "ai_text",
    confidenceScore: draft.confidenceScore ?? 0,
    nutritionConfidence: draft.nutritionConfidence ?? "low",
    needsReview: Boolean(draft.needsReview),
    notes: draft.notes ?? "",
    warnings: Array.isArray(draft.warnings) ? draft.warnings : [],
    matchedExistingFoodItemId: draft.matchedExistingFoodItemId ?? undefined,
  };
}

/**
 * Normalizes a recognized food draft from photo OCR to ensure no null values are passed to form controls.
 */
export function normalizeRecognizedFoodDraft(draft: any): RecognizedFoodDraft {
  if (!draft) {
    return {
      name: "",
      brand: "",
      amount: 1,
      unit: "piece",
      kcalPer100g: 0,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbsPer100g: 0,
      categories: ["other"],
      state: "ready",
      source: "photo_ocr",
      confidenceScore: 0,
      notes: "",
      warnings: [],
    };
  }

  return {
    ...draft,
    name: draft.name ?? "",
    brand: draft.brand ?? "",
    amount: draft.amount ?? draft.packageAmount ?? 1,
    unit: (draft.unit ?? draft.packageUnit ?? "piece") as FoodUnit,
    kcalPer100g: draft.kcalPer100g ?? 0,
    proteinPer100g: draft.proteinPer100g ?? 0,
    fatPer100g: draft.fatPer100g ?? 0,
    carbsPer100g: draft.carbsPer100g ?? 0,
    categories: Array.isArray(draft.categories) && draft.categories.length > 0 ? draft.categories : ["other"],
    state: (draft.state as FoodState) ?? "ready",
    source: draft.source || "photo_ocr",
    confidenceScore: draft.confidenceScore ?? 0,
    notes: draft.notes ?? "",
    warnings: Array.isArray(draft.warnings) ? draft.warnings : [],
  };
}
