/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { FoodLogEntry, DailyNutritionSummary } from '../types/foodLog';
import { foodLogService } from '../services/foodLogService';
import { useApp } from '../contexts/AppContext';
import { useAppUI } from '../contexts/AppUIContext';

export const useFoodLog = (date: string = new Date().toISOString().split('T')[0]) => {
  const { activeHousehold } = useApp();
  const { showConfirm } = useAppUI();
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const householdId = activeHousehold?.id;

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await foodLogService.getFoodLogEntries(householdId, date);
      setEntries(data);
    } catch (err) {
      setError('Failed to load food log entries');
    } finally {
      setLoading(false);
    }
  }, [date, householdId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entryData: Omit<FoodLogEntry, "id" | "createdAt">) => {
    await foodLogService.createFoodLogEntry(entryData, householdId);
    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!await showConfirm('Удалить запись из журнала? Обратите внимание: продукты не будут возвращены в холодильник автоматически.', 'Удаление', 'danger')) {
      return;
    }
    await foodLogService.deleteFoodLogEntry(id, householdId);
    await fetchEntries();
  };

  const getSummary = async (profileId: string, targetKcal?: number) => {
    return await foodLogService.getDailySummary(profileId, date, targetKcal, householdId);
  };

  return {
    entries,
    loading,
    error,
    addEntry,
    deleteEntry,
    getSummary,
    refreshEntries: fetchEntries
  };
};
