/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { FoodItem } from '../types/food';
import { fridgeService } from '../services/fridgeService';
import { useApp } from '../contexts/AppContext';

export const useFridge = () => {
  const { activeHousehold } = useApp();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const householdId = activeHousehold?.id;

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = fridgeService.subscribeToFoodItems((data) => {
      setItems(data);
      setLoading(false);
    }, householdId);

    // Safety timeout in case onSnapshot takes too long or fails silently
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [householdId]);

  const addFoodItem = async (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
    await fridgeService.createFoodItem(itemData, householdId);
    // onSnapshot will update the list
  };

  const updateFoodItem = async (id: string, updates: Partial<FoodItem>) => {
    await fridgeService.updateFoodItem(id, updates, householdId);
    // onSnapshot will update the list
  };

  const deleteFoodItem = async (id: string) => {
    await fridgeService.deleteFoodItem(id, householdId);
    // onSnapshot will update the list
  };

  const adjustAmount = async (id: string, delta: number) => {
    try {
      const item = items.find(i => i.id === id);
      if (item && item.amount + delta < 0) {
        throw new Error('Недостаточно продукта для списания');
      }
      await fridgeService.adjustFoodAmount(id, delta, householdId);
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Error adjusting amount');
    }
  };

  const setAmount = async (id: string, amount: number) => {
    await fridgeService.setFoodAmount(id, amount, householdId);
  };

  return {
    items,
    loading,
    error,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    adjustAmount,
    setAmount,
    refreshItems: async () => {} // Not needed with real-time sync
  };
};
