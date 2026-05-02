/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CookingResult } from '../types/cooking';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEY = 'fvf_cooking_history';

export const cookingHistoryService = {
  getHistory: async (householdId?: string): Promise<CookingResult[]> => {
    if (householdId) {
      const historyRef = collection(db, 'households', householdId, 'cookingHistory');
      const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() as CookingResult, id: doc.id }));
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  saveResult: async (result: CookingResult, householdId?: string): Promise<void> => {
    if (householdId) {
      const resultRef = doc(db, 'households', householdId, 'cookingHistory', result.id);
      await setDoc(resultRef, result);
    } else {
      const history = await cookingHistoryService.getHistory();
      history.unshift(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    }
  },

  deleteResult: async (id: string, householdId?: string): Promise<void> => {
    if (householdId) {
      const resultRef = doc(db, 'households', householdId, 'cookingHistory', id);
      await deleteDoc(resultRef);
    } else {
      const history = await cookingHistoryService.getHistory();
      const filtered = history.filter(h => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  }
};
