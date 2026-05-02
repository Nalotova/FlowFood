/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, FoodLogEntry } from '../../types';
import { MealType, TargetStrategy } from '../../types/cooking';
import { Target, PieChart, Info } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface TargetKcalPreviewProps {
  profiles: UserProfile[];
  selectedIds: string[];
  mealType: MealType;
  entries: FoodLogEntry[];
  strategy: TargetStrategy;
}

export const TargetKcalPreview: React.FC<TargetKcalPreviewProps> = ({ 
  profiles, 
  selectedIds, 
  mealType,
  entries,
  strategy
}) => {
  const selectedProfiles = React.useMemo(() => 
    profiles.filter(p => selectedIds.includes(p.id)),
    [profiles, selectedIds]
  );

  const previewData = React.useMemo(() => {
    return selectedProfiles.map(profile => {
      const distValue = profile.mealDistribution[mealType as keyof typeof profile.mealDistribution];
      const plannedMealKcal = (distValue && distValue > 1) 
        ? Math.round(distValue) 
        : Math.round((profile.dailyKcal || 2000) * (distValue || 0.25));
      
      const consumedToday = entries
        .filter(e => e.profileId === profile.id)
        .reduce((sum, e) => sum + e.kcal, 0);
      
      const remainingDaily = Math.round((profile.dailyKcal || 2000) - consumedToday);
      
      let target = plannedMealKcal;
      if (strategy === 'adapt_to_remaining_day') {
        target = Math.min(plannedMealKcal, Math.max(250, remainingDaily));
      }
      
      const finalTarget = Math.round(target * (profile.portionMultiplier || 1));
      
      return {
        profile,
        finalTarget,
        consumedToday,
        remainingDaily,
        plannedMealKcal
      };
    });
  }, [selectedProfiles, mealType, entries, strategy]);

  if (selectedProfiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
          <Target size={10} /> Прогноз расчёта
        </h4>
        <div className="flex items-center space-x-1 text-[9px] font-bold text-stone-300">
           <Info size={8} /> <span>Учитывается съеденное вне плана</span>
        </div>
      </div>
      
      <div className="bg-stone-800 rounded-[32px] p-6 text-white shadow-xl space-y-5">
        {previewData.map(({ profile, finalTarget, consumedToday, remainingDaily }) => (
          <div key={profile.id} className="space-y-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black uppercase">
                  {profile.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white/90">{profile.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-natural-accent">{finalTarget} ккал</div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                  Цель: {i18n.cooking.mealTypes[mealType as keyof typeof i18n.cooking.mealTypes] || mealType}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[8px] font-bold text-white/30 uppercase leading-none mb-1">День</div>
                <div className="text-[10px] font-black">{profile.dailyKcal}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[8px] font-bold text-white/30 uppercase leading-none mb-1">Съедено</div>
                <div className="text-[10px] font-black text-white/60">{consumedToday}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-xl">
                <div className="text-[8px] font-bold text-white/30 uppercase leading-none mb-1">Осталось</div>
                <div className="text-[10px] font-black text-natural-accent">{remainingDaily}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
