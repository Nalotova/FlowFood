/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types/profile';
import { profileServiceLocal } from './profileService.local';
import { profileServiceFirebase } from './profileService.firebase';

export const profileService = {
  getProfiles: async (householdId?: string): Promise<UserProfile[]> => {
    if (householdId) return profileServiceFirebase.getProfiles(householdId);
    return profileServiceLocal.getProfiles();
  },

  subscribeToProfiles: (callback: (profiles: UserProfile[]) => void, householdId?: string) => {
    if (householdId) return profileServiceFirebase.subscribeToProfiles(householdId, callback);
    return () => {};
  },

  createProfile: async (profile: UserProfile, householdId?: string): Promise<UserProfile> => {
    if (householdId) return profileServiceFirebase.createProfile(householdId, profile);
    return profileServiceLocal.createProfile(profile);
  },

  updateProfile: async (profile: UserProfile, householdId?: string): Promise<UserProfile> => {
    if (householdId) return profileServiceFirebase.updateProfile(householdId, profile);
    return profileServiceLocal.updateProfile(profile);
  },

  deleteProfile: async (id: string, householdId?: string): Promise<void> => {
    if (householdId) return profileServiceFirebase.deleteProfile(householdId, id);
    return profileServiceLocal.deleteProfile(id);
  },

  toggleProfileActive: async (id: string, householdId?: string): Promise<void> => {
    if (householdId) return profileServiceFirebase.toggleProfileActive(householdId, id);
    return profileServiceLocal.toggleProfileActive(id);
  }
};
