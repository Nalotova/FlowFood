/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodLogEntry, DailyNutritionSummary } from '../types/foodLog';

const STORAGE_KEY = 'family-food-log-entries';

export const foodLogServiceLocal = {
  getFoodLogEntries: async (date?: string): Promise<FoodLogEntry[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const entries: FoodLogEntry[] = data ? JSON.parse(data) : [];
    if (date) {
      return entries.filter(e => e.date === date);
    }
    return entries;
  },

  getEntriesByProfileAndDate: async (profileId: string, date: string): Promise<FoodLogEntry[]> => {
    const entries = await foodLogServiceLocal.getFoodLogEntries();
    return entries.filter(e => e.profileId === profileId && e.date === date);
  },

  createFoodLogEntry: async (entryData: Omit<FoodLogEntry, "id" | "createdAt">): Promise<FoodLogEntry> => {
    const entries = await foodLogServiceLocal.getFoodLogEntries();
    const newEntry: FoodLogEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return newEntry;
  },

  deleteFoodLogEntry: async (id: string): Promise<void> => {
    const entries = await foodLogServiceLocal.getFoodLogEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getDailySummary: async (profileId: string, date: string, targetKcal?: number): Promise<DailyNutritionSummary> => {
    const entries = await foodLogServiceLocal.getEntriesByProfileAndDate(profileId, date);
    const totals = entries.reduce((acc, entry) => {
      acc.kcal += entry.kcal;
      acc.protein += (entry.protein || 0);
      acc.fat += (entry.fat || 0);
      acc.carbs += (entry.carbs || 0);
      return acc;
    }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });

    return {
      profileId,
      date,
      targetKcal,
      consumedKcal: totals.kcal,
      remainingKcal: targetKcal ? Math.max(0, targetKcal - totals.kcal) : undefined,
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
    };
  }
};
