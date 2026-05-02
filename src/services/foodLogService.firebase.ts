/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { FoodLogEntry, DailyNutritionSummary } from '../types/foodLog';

export const foodLogServiceFirebase = {
  getFoodLogEntries: async (householdId: string, date?: string): Promise<FoodLogEntry[]> => {
    const logRef = collection(db, 'households', householdId, 'foodLogEntries');
    let q = query(logRef);
    if (date) {
      q = query(logRef, where('date', '==', date));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as FoodLogEntry, id: doc.id }));
  },

  getEntriesByProfileAndDate: async (householdId: string, profileId: string, date: string): Promise<FoodLogEntry[]> => {
    const logRef = collection(db, 'households', householdId, 'foodLogEntries');
    const q = query(logRef, where('profileId', '==', profileId), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as FoodLogEntry, id: doc.id }));
  },

  createFoodLogEntry: async (householdId: string, entryData: Omit<FoodLogEntry, "id" | "createdAt">): Promise<FoodLogEntry> => {
    const id = crypto.randomUUID();
    const newEntry: FoodLogEntry = {
      ...entryData,
      id,
      createdAt: new Date().toISOString(),
    };
    const logRef = doc(db, 'households', householdId, 'foodLogEntries', id);
    await setDoc(logRef, newEntry);
    return newEntry;
  },

  deleteFoodLogEntry: async (householdId: string, id: string): Promise<void> => {
    const logRef = doc(db, 'households', householdId, 'foodLogEntries', id);
    await deleteDoc(logRef);
  },

  getDailySummary: async (householdId: string, profileId: string, date: string, targetKcal?: number): Promise<DailyNutritionSummary> => {
    const entries = await foodLogServiceFirebase.getEntriesByProfileAndDate(householdId, profileId, date);
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
