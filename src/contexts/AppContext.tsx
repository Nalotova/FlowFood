/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { UserAppProfile, Household } from '../types/household';

interface AppContextType {
  user: User | null;
  userAppProfile: UserAppProfile | null;
  activeHousehold: Household | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [userAppProfile, setUserAppProfile] = useState<UserAppProfile | null>(null);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initAppData = async (currentUser: User, force = false) => {
    // If we already have the same user and household data, don't show full-screen loader
    const hasData = !!activeHousehold && !!userAppProfile;

    if (!force && hasData && user?.uid === currentUser.uid) {
      console.log("App data already initialized for user:", currentUser.uid);
      return;
    }

    try {
      if (!hasData || force) {
        setLoading(true);
      }
      
      setError(null);
      console.log(`${force ? 'Refreshing' : 'Initializing'} app data for user:`, currentUser.uid);
      const data = await authService.ensureUserAndHousehold(currentUser);
      
      if (!data || !data.activeHousehold) {
        throw new Error("Пространство дома не найдено или недоступно");
      }

      console.log("App data loaded. Household:", data.activeHousehold.id);
      setUserAppProfile(data.userAppProfile);
      setActiveHousehold(data.activeHousehold);
    } catch (err: any) {
      console.error("Failed to load app data:", err);
      const errorMessage = err?.message || "Неизвестная ошибка";
      setError(`Ошибка загрузки: ${errorMessage}. Попробуйте обновить страницу.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        initAppData(user);
      } else {
        setUserAppProfile(null);
        setActiveHousehold(null);
        setLoading(false);
      }
    }
  }, [user?.uid, authLoading]);

  const refreshData = async () => {
    if (user) {
      await initAppData(user, true);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      userAppProfile, 
      activeHousehold, 
      loading: authLoading || loading,
      error,
      refreshData,
      signInWithGoogle: async () => {
        try {
          await authService.signInWithGoogle();
        } catch (err) {
          console.error("Login failed:", err);
          setError("Ошибка при входе в Google");
        }
      },
      signOut: authService.signOut
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
