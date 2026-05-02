/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types/profile';

const STORAGE_KEY = 'fvf_profiles';

export const profileServiceLocal = {
  getProfiles: async (): Promise<UserProfile[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const profiles: UserProfile[] = data ? JSON.parse(data) : [];
    
    return profiles.map(profile => {
      if (!profile.proteinSettings) {
        if (profile.proteinTarget) {
          profile.proteinSettings = {
            mode: 'manual',
            proteinTargetGrams: profile.proteinTarget
          };
        } else {
          profile.proteinSettings = {
            mode: 'not_tracked'
          };
        }
      }
      return profile;
    });
  },

  saveProfiles: async (profiles: UserProfile[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  },

  createProfile: async (profile: UserProfile): Promise<UserProfile> => {
    const profiles = await profileServiceLocal.getProfiles();
    profiles.push(profile);
    await profileServiceLocal.saveProfiles(profiles);
    return profile;
  },

  updateProfile: async (profile: UserProfile): Promise<UserProfile> => {
    const profiles = await profileServiceLocal.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      profiles[index] = profile;
      await profileServiceLocal.saveProfiles(profiles);
    }
    return profile;
  },

  deleteProfile: async (id: string): Promise<void> => {
    const profiles = await profileServiceLocal.getProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    await profileServiceLocal.saveProfiles(filtered);
  },

  toggleProfileActive: async (id: string): Promise<void> => {
    const profiles = await profileServiceLocal.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles[index].isActive = !profiles[index].isActive;
      await profileServiceLocal.saveProfiles(profiles);
    }
  }
};
