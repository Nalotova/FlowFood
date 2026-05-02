/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types/profile';
import { handleFirestoreError, OperationType } from './firestoreUtils';

export const profileServiceFirebase = {
  getProfiles: async (householdId: string): Promise<UserProfile[]> => {
    const path = `households/${householdId}/profiles`;
    try {
      const profilesRef = collection(db, 'households', householdId, 'profiles');
      const snapshot = await getDocs(profilesRef);
      return snapshot.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToProfiles: (householdId: string, callback: (profiles: UserProfile[]) => void) => {
    const profilesRef = collection(db, 'households', householdId, 'profiles');
    return onSnapshot(profilesRef, (snapshot) => {
      const profiles = snapshot.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id }));
      callback(profiles);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `households/${householdId}/profiles`);
    });
  },

  createProfile: async (householdId: string, profile: UserProfile): Promise<UserProfile> => {
    const path = `households/${householdId}/profiles/${profile.id}`;
    try {
      const profilesRef = collection(db, 'households', householdId, 'profiles');
      const docRef = doc(profilesRef, profile.id);
      await setDoc(docRef, profile);
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateProfile: async (householdId: string, profile: UserProfile): Promise<UserProfile> => {
    const path = `households/${householdId}/profiles/${profile.id}`;
    try {
      const profileRef = doc(db, 'households', householdId, 'profiles', profile.id);
      await setDoc(profileRef, profile, { merge: true });
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteProfile: async (householdId: string, id: string): Promise<void> => {
    const path = `households/${householdId}/profiles/${id}`;
    try {
      const profileRef = doc(db, 'households', householdId, 'profiles', id);
      await deleteDoc(profileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  toggleProfileActive: async (householdId: string, id: string): Promise<void> => {
    const path = `households/${householdId}/profiles/${id}`;
    try {
      const profileRef = doc(db, 'households', householdId, 'profiles', id);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const current = snap.data() as UserProfile;
        await updateDoc(profileRef, { isActive: !current.isActive });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
