/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { UserAppProfile, Household, HouseholdInvite, HouseholdRole } from '../types/household';
import { householdService, canEditHouseholdData, canInviteMembers, canManageMembers } from '../services/householdService';

interface AppContextType {
  user: User | null;
  userAppProfile: UserAppProfile | null;
  activeHousehold: Household | null;
  pendingInvites: HouseholdInvite[];
  userRole: HouseholdRole;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  switchHousehold: (householdId: string) => Promise<void>;
  acceptInvite: (invite: HouseholdInvite) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  navbarHidden: boolean;
  setNavbarHidden: (hidden: boolean) => void;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
    canManage: boolean;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [userAppProfile, setUserAppProfile] = useState<UserAppProfile | null>(null);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navbarHidden, setNavbarHidden] = useState(false);

  useEffect(() => {
    if (authError) {
      setError(`Auth Initialization Failed: ${authError.message}`);
    }
  }, [authError]);
  
  const userRole: HouseholdRole = React.useMemo(() => {
    if (!user || !activeHousehold) {
      console.log("Role Check: No user or active household", { userId: user?.uid, hid: activeHousehold?.id });
      return 'viewer';
    }
    
    // CRITICAL: Force owner role if UID matches the record owner
    if (activeHousehold.ownerUserId === user.uid) {
      console.log("Role Check: User matches Owner UID", user.uid);
      return 'owner';
    }

    // Secondary check: Are they in the members list?
    const member = activeHousehold.members?.find(m => m.userId === user.uid);
    if (member) {
      console.log("Role Check: Found user in members list with role:", member.role);
      return member.role as HouseholdRole;
    }

    // Default to viewer if we can't determine role, but log it
    console.warn("Role Check: User not owner and not in members list", {
      uid: user.uid,
      ownerId: activeHousehold.ownerUserId,
      membersCount: activeHousehold.members?.length || 0
    });
    return 'viewer';
  }, [user?.uid, activeHousehold?.id, activeHousehold?.ownerUserId, activeHousehold?.members]);

  const permissions = React.useMemo(() => ({
    canEdit: canEditHouseholdData(userRole),
    canInvite: canInviteMembers(userRole),
    canManage: canManageMembers(userRole)
  }), [userRole]);

  const initAppData = async (currentUser: User, force = false) => {
    // Determine if we need to show the full screen loader
    const hasActiveHousehold = !!activeHousehold;
    const hasUserProfile = !!userAppProfile;
    
    // Repair if owner is missing from members or members list is empty
    const needsRepair = activeHousehold && 
                       activeHousehold.ownerUserId === currentUser.uid && 
                       (!activeHousehold.members || activeHousehold.members.length === 0);

    if (!force && hasActiveHousehold && hasUserProfile && !needsRepair && user?.uid === currentUser.uid) {
      return;
    }

    try {
      if (!hasActiveHousehold || !hasUserProfile || force) {
        setLoading(true);
      }
      
      setError(null);
      const data = await authService.ensureUserAndHousehold(currentUser);
      
      if (!data || !data.activeHousehold) {
        throw new Error("Пространство дома не найдено или недоступно");
      }

      // Repair if needed
      let household = data.activeHousehold;
      if (household.ownerUserId === currentUser.uid && currentUser.email) {
        household = await householdService.repairHouseholdMembers(household, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || ""
        });
      }

      setUserAppProfile(data.userAppProfile);
      setActiveHousehold(household);

      // Check for pending invites
      if (currentUser.email) {
        const invites = await householdService.getPendingInvitesForEmail(currentUser.email);
        setPendingInvites(invites);
      }

    } catch (err: any) {
      console.error("Failed to load app data:", err);
      const errorMessage = err?.message || JSON.stringify(err) || "Unknown error";
      setError(`Ошибка загрузки данных: ${errorMessage}. Попробуйте обновить страницу или выйти/войти.`);
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
        setPendingInvites([]);
        setLoading(false);
      }
    }
  }, [user?.uid, authLoading]);

  const refreshData = async () => {
    if (user) {
      await initAppData(user, true);
    }
  };

  const switchHousehold = async (householdId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await householdService.switchActiveHousehold(user.uid, householdId);
      await initAppData(user, true);
    } catch (err) {
      console.error("Failed to switch household:", err);
      setError("Ошибка при переключении дома");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (invite: HouseholdInvite) => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      await householdService.acceptHouseholdInvite(invite, user.uid, user.email, user.displayName || undefined);
      await initAppData(user, true);
    } catch (err) {
      console.error("Failed to accept invite:", err);
      // Try to extract more details about the error
      let details = "Ошибка при принятии приглашения";
      if (err instanceof Error) {
        details += "\n" + err.message;
      } else {
        details += "\n" + String(err);
      }
      setError(details);
    } finally {
      setLoading(false);
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      await householdService.declineHouseholdInvite(inviteId);
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error("Failed to decline invite:", err);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      userAppProfile, 
      activeHousehold, 
      pendingInvites,
      userRole,
      loading: authLoading || loading,
      error,
      refreshData,
      switchHousehold,
      acceptInvite,
      declineInvite,
      permissions,
      navbarHidden,
      setNavbarHidden,
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
