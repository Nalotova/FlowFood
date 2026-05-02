/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Household {
  id: string;
  name: string;
  ownerUserId: string;
  memberUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserAppProfile {
  uid: string;
  email?: string;
  displayName?: string;
  householdIds: string[];
  activeHouseholdId?: string;
  createdAt: string;
  updatedAt: string;
}
