/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { UserAppProfile, Household } from '../types/household';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export const authService = {
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'auth/google');
      throw error;
    }
  },

  signOut: async () => {
    return firebaseSignOut(auth);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },

  onAuthChanged: (callback: (user: User | null) => void, errorCallback?: (error: any) => void) => {
    return onAuthStateChanged(auth, callback, errorCallback);
  },

  ensureUserAndHousehold: async (user: User): Promise<{ userAppProfile: UserAppProfile; activeHousehold: Household }> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userAppProfile = userSnap.data() as UserAppProfile;
        const householdId = userAppProfile.activeHouseholdId;
        
        if (householdId) {
          const householdRef = doc(db, 'households', householdId);
          const householdSnap = await getDoc(householdRef);
          
          if (householdSnap.exists()) {
            return { 
              userAppProfile, 
              activeHousehold: { id: householdSnap.id, ...householdSnap.data() } as Household 
            };
          }
        }
        
        // Fallback: Profile exists but household is missing or corrupted
        console.warn("Active household missing, attempting to recover...");
        const fallbackHouseholdId = userAppProfile.householdIds?.[0] || doc(collection(db, 'households')).id;
        const household: Household = {
          id: fallbackHouseholdId,
          name: "Мой дом (восстановлен)",
          ownerUserId: user.uid,
          memberUserIds: [user.uid],
          members: [{
            userId: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            role: "owner",
            joinedAt: new Date().toISOString()
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'households', fallbackHouseholdId), household);
        
        const updatedProfile: UserAppProfile = {
          ...userAppProfile,
          activeHouseholdId: fallbackHouseholdId,
          householdIds: userAppProfile.householdIds?.includes(fallbackHouseholdId) 
            ? userAppProfile.householdIds 
            : [...(userAppProfile.householdIds || []), fallbackHouseholdId]
        };
        
        await setDoc(userRef, updatedProfile);
        return { userAppProfile: updatedProfile, activeHousehold: household };
      }

      // New user checkout
      console.log("Creating new user profile and household...");
      const newHouseholdId = doc(collection(db, 'households')).id;
      const household: Household = {
        id: newHouseholdId,
        name: "Мой дом",
        ownerUserId: user.uid,
        memberUserIds: [user.uid],
        members: [{
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          role: "owner",
          joinedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newUserProfile: UserAppProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        householdIds: [newHouseholdId],
        activeHouseholdId: newHouseholdId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save both
      await setDoc(doc(db, 'households', newHouseholdId), household);
      await setDoc(userRef, newUserProfile);

      return { userAppProfile: newUserProfile, activeHousehold: household };
    } catch (error: any) {
      console.error("Critical error in ensureUserAndHousehold:", error);
      handleFirestoreError(error, OperationType.GET, 'users/profile-init');
      throw error;
    }
  }
};
