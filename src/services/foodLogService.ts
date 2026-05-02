/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodLogEntry, DailyNutritionSummary } from '../types/foodLog';
import { foodLogServiceLocal } from './foodLogService.local';
import { foodLogServiceFirebase } from './foodLogService.firebase';

export const foodLogService = {
  getFoodLogEntries: async (householdId?: string, date?: string): Promise<FoodLogEntry[]> => {
    if (householdId) return foodLogServiceFirebase.getFoodLogEntries(householdId, date);
    return foodLogServiceLocal.getFoodLogEntries(date);
  },

  getEntriesByProfileAndDate: async (profileId: string, date: string, householdId?: string): Promise<FoodLogEntry[]> => {
    if (householdId) return foodLogServiceFirebase.getEntriesByProfileAndDate(householdId, profileId, date);
    return foodLogServiceLocal.getEntriesByProfileAndDate(profileId, date);
  },

  createFoodLogEntry: async (entryData: Omit<FoodLogEntry, "id" | "createdAt">, householdId?: string): Promise<FoodLogEntry> => {
    if (householdId) return foodLogServiceFirebase.createFoodLogEntry(householdId, entryData);
    return foodLogServiceLocal.createFoodLogEntry(entryData);
  },

  deleteFoodLogEntry: async (id: string, householdId?: string): Promise<void> => {
    if (householdId) return foodLogServiceFirebase.deleteFoodLogEntry(householdId, id);
    return foodLogServiceLocal.deleteFoodLogEntry(id);
  },

  getDailySummary: async (profileId: string, date: string, targetKcal?: number, householdId?: string): Promise<DailyNutritionSummary> => {
    if (householdId) return foodLogServiceFirebase.getDailySummary(householdId, profileId, date, targetKcal);
    return foodLogServiceLocal.getDailySummary(profileId, date, targetKcal);
  }
};
