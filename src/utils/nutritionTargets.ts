/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, MealType } from '../types';

export function getDailyProteinTarget(profile: UserProfile): number | null {
  const targets = profile.nutritionTargets;
  
  if (targets) {
    if (targets.proteinMode === 'manual') return targets.proteinGrams || null;
    if (targets.proteinMode === 'per_kg') {
      return (targets.bodyWeightKg || 0) * (targets.proteinPerKg || 0) || null;
    }
  }

  // Fallback to old proteinSettings
  if (profile.proteinSettings) {
    if (profile.proteinSettings.mode === 'manual') return profile.proteinSettings.proteinTargetGrams || null;
    if (profile.proteinSettings.mode === 'auto') {
      return (profile.proteinSettings.bodyWeightKg || 0) * (profile.proteinSettings.proteinPerKg || 0) || null;
    }
  }

  // Fallback to proteinTarget field
  return profile.proteinTarget || null;
}

export function getDailyFatTargetRange(profile: UserProfile): { min?: number; max?: number; target?: number } | null {
  const targets = profile.nutritionTargets;
  if (!targets || targets.fatMode === 'not_tracked') return null;

  if (targets.fatMode === 'manual') return { target: targets.fatGrams };
  if (targets.fatMode === 'range') return { min: targets.fatMinGrams, max: targets.fatMaxGrams };
  if (targets.fatMode === 'percent') {
    const kcal = profile.dailyKcal || 2000;
    const target = Math.round((kcal * (targets.fatPercent || 25) / 100) / 9);
    return { target };
  }

  return null;
}

export function getDailyCarbTargetRange(profile: UserProfile): { min?: number; max?: number; target?: number } | null {
  const targets = profile.nutritionTargets;
  if (!targets || targets.carbMode === 'not_tracked') return null;

  if (targets.carbMode === 'manual') return { target: targets.carbGrams };
  if (targets.carbMode === 'range') return { min: targets.carbMinGrams, max: targets.carbMaxGrams };
  
  if (targets.carbMode === 'remaining') {
    const kcal = profile.dailyKcal || 2000;
    const proteinTarget = getDailyProteinTarget(profile) || 0;
    const fatRange = getDailyFatTargetRange(profile);
    const fatTarget = fatRange?.target || (fatRange?.min ? (fatRange.min + (fatRange.max || fatRange.min)) / 2 : (kcal * 0.3 / 9));
    
    const remainingKcal = kcal - (proteinTarget * 4) - (fatTarget * 9);
    return { target: Math.max(0, Math.round(remainingKcal / 4)) };
  }

  return null;
}

export function getMealMacroTargets(profile: UserProfile, mealType: MealType, targetMealKcal: number) {
  const dailyKcal = profile.dailyKcal || 2000;
  const ratio = targetMealKcal / dailyKcal;

  const result: {
    proteinTarget?: number;
    proteinMin?: number;
    proteinMax?: number;
    fatTarget?: number;
    fatMin?: number;
    fatMax?: number;
    carbTarget?: number;
    carbMin?: number;
    carbMax?: number;
  } = {};

  // Protein
  const dailyProtein = getDailyProteinTarget(profile);
  if (dailyProtein) {
    result.proteinTarget = Math.round(dailyProtein * ratio);
    result.proteinMin = Math.round(result.proteinTarget * 0.85);
    result.proteinMax = Math.round(result.proteinTarget * 1.25);
  }

  // Fat
  const dailyFat = getDailyFatTargetRange(profile);
  if (dailyFat) {
    if (dailyFat.target) result.fatTarget = Math.round(dailyFat.target * ratio);
    if (dailyFat.min) result.fatMin = Math.round(dailyFat.min * ratio);
    if (dailyFat.max) result.fatMax = Math.round(dailyFat.max * ratio);
  }

  // Carbs
  const dailyCarbs = getDailyCarbTargetRange(profile);
  if (dailyCarbs) {
    if (dailyCarbs.target) result.carbTarget = Math.round(dailyCarbs.target * ratio);
    if (dailyCarbs.min) result.carbMin = Math.round(dailyCarbs.min * ratio);
    if (dailyCarbs.max) result.carbMax = Math.round(dailyCarbs.max * ratio);
  }

  return result;
}
