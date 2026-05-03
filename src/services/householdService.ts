/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Household, HouseholdInvite, HouseholdMember, UserAppProfile, HouseholdRole } from '../types/household';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

const HOUSEHOLDS_COLLECTION = 'households';
const INVITES_COLLECTION = 'householdInvites';
const USERS_COLLECTION = 'users';

export const canEditHouseholdData = (role: HouseholdRole) => role === 'owner' || role === 'member';
export const canInviteMembers = (role: HouseholdRole) => role === 'owner' || role === 'member';
export const canManageMembers = (role: HouseholdRole) => role === 'owner';

export const householdService = {
  async getActiveHousehold(userId: string): Promise<Household | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data() as UserAppProfile;
      if (!userData.activeHouseholdId) return null;
      
      const householdDoc = await getDoc(doc(db, HOUSEHOLDS_COLLECTION, userData.activeHouseholdId));
      if (!householdDoc.exists()) return null;
      
      return { id: householdDoc.id, ...householdDoc.data() } as Household;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${HOUSEHOLDS_COLLECTION}/active`);
      return null;
    }
  },

  async getUserProfile(userId: string): Promise<UserAppProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) return null;
      return userDoc.data() as UserAppProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
      return null;
    }
  },

  async createHouseholdForUser(userId: string, email: string, displayName?: string): Promise<Household> {
    const householdId = doc(collection(db, HOUSEHOLDS_COLLECTION)).id;
    const now = new Date().toISOString();
    
    const newHousehold: Household = {
      id: householdId,
      name: "Мой Дом",
      ownerUserId: userId,
      memberUserIds: [userId],
      members: [{
        userId,
        email,
        displayName,
        role: "owner",
        joinedAt: now
      }],
      createdAt: now,
      updatedAt: now
    };

    const batch = writeBatch(db);
    
    // Save household
    batch.set(doc(db, HOUSEHOLDS_COLLECTION, householdId), newHousehold);
    
    // Update user profile
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.set(userRef, {
      uid: userId,
      email: email.toLowerCase(),
      displayName: displayName || "",
      householdIds: [householdId],
      activeHouseholdId: householdId,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    await batch.commit();
    return newHousehold;
  },

  async inviteUserToHousehold(params: {
    householdId: string;
    householdName: string;
    invitedEmail: string;
    invitedByUserId: string;
    invitedByEmail: string;
    role: "member" | "viewer";
  }): Promise<string> {
    const email = params.invitedEmail.toLowerCase().trim();
    
    // Check for existing pending invite
    const q = query(
      collection(db, INVITES_COLLECTION),
      where("householdId", "==", params.householdId),
      where("invitedEmail", "==", email),
      where("status", "==", "pending")
    );
    
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error("Приглашение уже отправлено.");
    }

    const inviteId = doc(collection(db, INVITES_COLLECTION)).id;
    const invite: HouseholdInvite = {
      id: inviteId,
      householdId: params.householdId,
      householdName: params.householdName,
      invitedEmail: email,
      invitedByUserId: params.invitedByUserId,
      invitedByEmail: params.invitedByEmail,
      role: params.role,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, INVITES_COLLECTION, inviteId), invite);
    return inviteId;
  },

  async getPendingInvitesForEmail(email: string): Promise<HouseholdInvite[]> {
    try {
      const q = query(
        collection(db, INVITES_COLLECTION),
        where("invitedEmail", "==", email.toLowerCase()),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data() as HouseholdInvite);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, INVITES_COLLECTION);
      return [];
    }
  },

  async acceptHouseholdInvite(invite: HouseholdInvite, userId: string, userEmail: string, displayName?: string): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // 1. Update invite status
    batch.update(doc(db, INVITES_COLLECTION, invite.id), {
      status: "accepted",
      acceptedAt: now
    });

    // 2. Add member to household
    const member: HouseholdMember = {
      userId,
      email: userEmail,
      displayName: displayName || "",
      role: invite.role as HouseholdRole,
      joinedAt: now
    };
    
    batch.update(doc(db, HOUSEHOLDS_COLLECTION, invite.householdId), {
      members: arrayUnion(member),
      memberUserIds: arrayUnion(userId),
      updatedAt: now
    });

    // 3. Update user profile
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.set(userRef, {
      uid: userId,
      email: userEmail.toLowerCase(),
      householdIds: arrayUnion(invite.householdId),
      activeHouseholdId: invite.householdId, // Automatically switch to new household
      updatedAt: now
    }, { merge: true });

    await batch.commit();
  },

  async declineHouseholdInvite(inviteId: string): Promise<void> {
    await updateDoc(doc(db, INVITES_COLLECTION, inviteId), {
      status: "declined",
      declinedAt: new Date().toISOString()
    });
  },

  async switchActiveHousehold(userId: string, householdId: string): Promise<void> {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      activeHouseholdId: householdId,
      updatedAt: new Date().toISOString()
    });
  },

  async removeMemberFromHousehold(householdId: string, memberUserId: string): Promise<void> {
    const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
    const householdDoc = await getDoc(householdRef);
    if (!householdDoc.exists()) return;
    
    const household = householdDoc.data() as Household;
    const memberToRemove = household.members?.find(m => m.userId === memberUserId);
    
    if (!memberToRemove) return;
    if (memberToRemove.role === 'owner') throw new Error("Нельзя удалить владельца дома.");

    const batch = writeBatch(db);
    
    // Remove from household
    batch.update(householdRef, {
      members: arrayRemove(memberToRemove),
      memberUserIds: arrayRemove(memberUserId),
      updatedAt: new Date().toISOString()
    });

    // Remove from user profile
    const userRef = doc(db, USERS_COLLECTION, memberUserId);
    batch.set(userRef, {
      householdIds: arrayRemove(householdId),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await batch.commit();
  },

  async updateMemberRole(householdId: string, memberUserId: string, newRole: HouseholdRole): Promise<void> {
    const householdRef = doc(db, HOUSEHOLDS_COLLECTION, householdId);
    const householdDoc = await getDoc(householdRef);
    if (!householdDoc.exists()) return;
    
    const household = householdDoc.data() as Household;
    const updatedMembers = (household.members || []).map(m => 
      m.userId === memberUserId ? { ...m, role: newRole } : m
    );

    await updateDoc(householdRef, {
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    });
  },

  async updateHouseholdName(householdId: string, name: string): Promise<void> {
    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      name,
      updatedAt: new Date().toISOString()
    });
  },

  async repairHouseholdMembers(household: Household, user: { uid: string, email: string, displayName?: string }): Promise<Household> {
    if (household.ownerUserId !== user.uid) return household;
    
    const memberUserIds = household.memberUserIds || [];
    const members = household.members || [];
    
    const isMemberInIds = memberUserIds.includes(user.uid);
    const memberObj = members.find(m => m.userId === user.uid);
    const hasOwnerRole = memberObj?.role === 'owner';
    
    // If everything is correct and we have at least the owner, skip
    if (isMemberInIds && hasOwnerRole && members.length > 0) return household;
    
    console.log("CRITICAL: Repairing household members for owner:", user.uid);
    
    const now = new Date().toISOString();
    const updatedMemberIds = Array.from(new Set([...memberUserIds, user.uid]));
    
    const otherMembers = members.filter(m => m.userId !== user.uid);
    const updatedMembers: HouseholdMember[] = [
      {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: "owner",
        joinedAt: memberObj?.joinedAt || now
      },
      ...otherMembers
    ];

    const householdRef = doc(db, HOUSEHOLDS_COLLECTION, household.id);
    try {
      await updateDoc(householdRef, {
        memberUserIds: updatedMemberIds,
        members: updatedMembers,
        updatedAt: now
      });
    } catch (err) {
      console.error("Failed to repair household in Firestore:", err);
      // Even if update fails, return the "simulated" repaired object so UI shows correctly
    }

    return {
      ...household,
      memberUserIds: updatedMemberIds,
      members: updatedMembers,
      updatedAt: now
    };
  }
};
