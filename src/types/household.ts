/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HouseholdRole = "owner" | "member" | "viewer";

export interface HouseholdMember {
  userId: string;
  email?: string;
  displayName?: string;
  role: HouseholdRole;
  joinedAt: string;
}

export interface Household {
  id: string;
  name: string;
  ownerUserId: string;
  memberUserIds: string[];
  members: HouseholdMember[];
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdInvite {
  id: string;
  householdId: string;
  householdName: string;
  invitedEmail: string;
  invitedByUserId: string;
  invitedByEmail?: string;
  role: "member" | "viewer";
  status: "pending" | "accepted" | "declined" | "revoked";
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export interface UserAppProfile {
  uid: string;
  email: string;
  displayName?: string;
  householdIds: string[];
  activeHouseholdId?: string;
  createdAt: string;
  updatedAt: string;
}
