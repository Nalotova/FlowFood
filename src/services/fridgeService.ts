/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodItem } from '../types/food';
import { fridgeServiceLocal } from './fridgeService.local';
import { fridgeServiceFirebase } from './fridgeService.firebase';

export const fridgeService = {
  getFoodItems: async (householdId?: string): Promise<FoodItem[]> => {
    if (householdId) return fridgeServiceFirebase.getFoodItems(householdId);
    return fridgeServiceLocal.getFoodItems();
  },

  subscribeToFoodItems: (callback: (items: FoodItem[]) => void, householdId?: string) => {
    if (householdId) return fridgeServiceFirebase.subscribeToFoodItems(householdId, callback);
    // Local storage doesn't support easy subscription, so we can just poll or do nothing
    // But since the user is using Firebase, that's what matters
    return () => {}; 
  },

  createFoodItem: async (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">, householdId?: string): Promise<FoodItem> => {
    if (householdId) return fridgeServiceFirebase.createFoodItem(householdId, itemData);
    return fridgeServiceLocal.createFoodItem(itemData);
  },

  updateFoodItem: async (id: string, updates: Partial<FoodItem>, householdId?: string): Promise<FoodItem> => {
    if (householdId) return fridgeServiceFirebase.updateFoodItem(householdId, id, updates);
    return fridgeServiceLocal.updateFoodItem(id, updates);
  },

  deleteFoodItem: async (id: string, householdId?: string): Promise<void> => {
    if (householdId) return fridgeServiceFirebase.deleteFoodItem(householdId, id);
    return fridgeServiceLocal.deleteFoodItem(id);
  },

  adjustFoodAmount: async (id: string, delta: number, householdId?: string): Promise<void> => {
    if (householdId) return fridgeServiceFirebase.adjustFoodAmount(householdId, id, delta);
    return fridgeServiceLocal.adjustFoodAmount(id, delta).then(() => {});
  },

  setFoodAmount: async (id: string, amount: number, householdId?: string): Promise<void> => {
    if (householdId) return fridgeServiceFirebase.setFoodAmount(householdId, id, amount);
    return fridgeServiceLocal.setFoodAmount(id, amount).then(() => {});
  }
};
