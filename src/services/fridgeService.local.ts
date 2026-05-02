/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodItem } from '../types/food';

const STORAGE_KEY = 'family-fridge-items';

export const fridgeServiceLocal = {
  getFoodItems: async (): Promise<FoodItem[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFoodItems: async (items: FoodItem[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  createFoodItem: async (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">): Promise<FoodItem> => {
    const items = await fridgeServiceLocal.getFoodItems();
    const newItem: FoodItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    await fridgeServiceLocal.saveFoodItems(items);
    return newItem;
  },

  updateFoodItem: async (id: string, updates: Partial<FoodItem>): Promise<FoodItem> => {
    const items = await fridgeServiceLocal.getFoodItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updatedItem;
    await fridgeServiceLocal.saveFoodItems(items);
    return updatedItem;
  },

  deleteFoodItem: async (id: string): Promise<void> => {
    const items = await fridgeServiceLocal.getFoodItems();
    const filtered = items.filter(i => i.id !== id);
    await fridgeServiceLocal.saveFoodItems(filtered);
  },

  adjustFoodAmount: async (id: string, delta: number): Promise<FoodItem> => {
    const items = await fridgeServiceLocal.getFoodItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const newAmount = Math.max(0, items[index].amount + delta);
    const updatedItem = {
      ...items[index],
      amount: newAmount,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updatedItem;
    await fridgeServiceLocal.saveFoodItems(items);
    return updatedItem;
  },

  setFoodAmount: async (id: string, amount: number): Promise<FoodItem> => {
    const items = await fridgeServiceLocal.getFoodItems();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Product not found');
    
    const updatedItem = {
      ...items[index],
      amount: Math.max(0, amount),
      updatedAt: new Date().toISOString(),
    };
    items[index] = updatedItem;
    await fridgeServiceLocal.saveFoodItems(items);
    return updatedItem;
  },
};
