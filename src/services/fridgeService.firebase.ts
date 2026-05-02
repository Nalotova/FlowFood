/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  runTransaction,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { FoodItem } from '../types/food';
import { handleFirestoreError, OperationType } from './firestoreUtils';

export const fridgeServiceFirebase = {
  getFoodItems: async (householdId: string): Promise<FoodItem[]> => {
    const fridgeRef = collection(db, 'households', householdId, 'fridgeItems');
    const snapshot = await getDocs(fridgeRef);
    return snapshot.docs.map(doc => ({ ...doc.data() as FoodItem, id: doc.id }));
  },

  subscribeToFoodItems: (householdId: string, callback: (items: FoodItem[]) => void) => {
    const fridgeRef = collection(db, 'households', householdId, 'fridgeItems');
    // Using a simpler query first to ensure we see items even without updatedAt
    const q = query(fridgeRef); 
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data() as FoodItem, id: doc.id }));
      // Sort in memory if needed, or by name
      items.sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || '';
        const dateB = b.updatedAt || b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
      callback(items);
    }, (error) => {
      console.error("Subscription error for fridgeItems:", error);
      handleFirestoreError(error, OperationType.LIST, `households/${householdId}/fridgeItems`);
    });
  },

  createFoodItem: async (householdId: string, itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">): Promise<FoodItem> => {
    const id = crypto.randomUUID();
    const newItem: FoodItem = {
      ...itemData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const itemRef = doc(db, 'households', householdId, 'fridgeItems', id);
    await setDoc(itemRef, newItem);
    return newItem;
  },

  updateFoodItem: async (householdId: string, id: string, updates: Partial<FoodItem>): Promise<FoodItem> => {
    const itemRef = doc(db, 'households', householdId, 'fridgeItems', id);
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(itemRef, updatedData);
    // Note: This partial return might be tricky if we don't fetch it, but usually updateDoc is enough
    return { id, ...updates } as FoodItem;
  },

  deleteFoodItem: async (householdId: string, id: string): Promise<void> => {
    const itemRef = doc(db, 'households', householdId, 'fridgeItems', id);
    await deleteDoc(itemRef);
  },

  adjustFoodAmount: async (householdId: string, id: string, delta: number): Promise<void> => {
    const itemRef = doc(db, 'households', householdId, 'fridgeItems', id);
    await runTransaction(db, async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists()) throw new Error("Product not found");
      
      const currentAmount = itemDoc.data().amount || 0;
      const newAmount = Math.max(0, currentAmount + delta);
      transaction.update(itemRef, { 
        amount: newAmount,
        updatedAt: new Date().toISOString()
      });
    });
  },

  setFoodAmount: async (householdId: string, id: string, amount: number): Promise<void> => {
    const itemRef = doc(db, 'households', householdId, 'fridgeItems', id);
    await updateDoc(itemRef, { 
      amount: Math.max(0, amount),
      updatedAt: new Date().toISOString()
    });
  },
};
