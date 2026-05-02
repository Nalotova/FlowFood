/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, 
  CookingRequest, 
  FoodLogEntry,
  MealTargetInfo
} from '../types';
import { getMealMacroTargets } from '../utils/nutritionTargets';

export const cookingService = {
  calculateTargetInfo: async ({
    request,
    profiles,
    foodLogEntries = []
  }: {
    request: Omit<CookingRequest, 'id' | 'createdAt'>;
    profiles: UserProfile[];
    foodLogEntries?: FoodLogEntry[];
  }): Promise<MealTargetInfo[]> => {
    const selectedParticipants = profiles.filter(p => request.participantIds.includes(p.id) && p.isActive);
    const targetInfo: MealTargetInfo[] = [];

    for (const profile of selectedParticipants) {
      const consumedToday = foodLogEntries
        .filter(e => e.profileId === profile.id)
        .reduce((sum, e) => sum + e.kcal, 0);

      const distValue = profile.mealDistribution[request.mealType as keyof typeof profile.mealDistribution];
      const plannedMealKcal = (distValue && distValue > 1) 
        ? Math.round(distValue) 
        : Math.round((profile.dailyKcal || 2000) * (distValue || 0.25));
      const remainingDayKcal = Math.round((profile.dailyKcal || 2000) - consumedToday);
      
      let targetMealKcal = plannedMealKcal;
      if (request.targetStrategy === 'adapt_to_remaining_day') {
        targetMealKcal = Math.min(plannedMealKcal, Math.max(250, remainingDayKcal));
      }

      const finalTarget = Math.round(targetMealKcal * (profile.portionMultiplier || 1));

      // Calculate macro targets
      const macroTargets = getMealMacroTargets(profile, request.mealType, finalTarget);

      targetInfo.push({
        profileId: profile.id,
        profileName: profile.name,
        dailyKcal: profile.dailyKcal,
        plannedMealKcal,
        consumedTodayKcal: consumedToday,
        remainingDayKcal,
        targetMealKcal: finalTarget,
        portionMultiplier: profile.portionMultiplier || 1,
        ...macroTargets
      });
    }
    return targetInfo;
  }
};
