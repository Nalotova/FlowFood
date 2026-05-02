/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/profile';
import { profileService } from '../services/profileService';
import { useApp } from '../contexts/AppContext';

export const useProfiles = () => {
  const { activeHousehold } = useApp();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const householdId = activeHousehold?.id;

  useEffect(() => {
    if (!householdId) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = profileService.subscribeToProfiles((data) => {
      setProfiles(data);
      setLoading(false);
    }, householdId);

    return () => unsubscribe();
  }, [householdId]);

  const addProfile = async (profileData: Omit<UserProfile, 'id'>) => {
    await profileService.createProfile(profileData as UserProfile, householdId);
  };

  const updateProfile = async (profile: UserProfile) => {
    await profileService.updateProfile(profile, householdId);
  };

  const deleteProfile = async (id: string) => {
    await profileService.deleteProfile(id, householdId);
  };

  const toggleActive = async (id: string) => {
    await profileService.toggleProfileActive(id, householdId);
  };

  return {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    toggleActive,
    refresh: async () => {} 
  };
};
