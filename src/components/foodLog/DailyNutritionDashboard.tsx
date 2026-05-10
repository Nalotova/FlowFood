/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { FoodLogEntry } from '../../types/foodLog';
import { UserProfile } from '../../types/profile';
import { i18n } from '../../i18n/ru';

interface DailyNutritionDashboardProps {
  entries: FoodLogEntry[];
  profiles: UserProfile[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedProfileId: string | 'all';
  onProfileChange: (id: string | 'all') => void;
}

export const DailyNutritionDashboard: React.FC<DailyNutritionDashboardProps> = ({
  entries,
  profiles,
  selectedDate,
  onDateChange,
  selectedProfileId,
  onProfileChange,
}) => {
  const activeProfile = profiles.find(p => p.id === selectedProfileId);
  
  // Filtering entries
  const filteredEntries = entries.filter(entry => 
    selectedProfileId === 'all' || entry.profileId === selectedProfileId
  );

  // Consumed totals
  const consumed = filteredEntries.reduce((acc, entry) => ({
    kcal: acc.kcal + (entry.kcal || 0),
    protein: acc.protein + (entry.protein || 0),
    fat: acc.fat + (entry.fat || 0),
    carbs: acc.carbs + (entry.carbs || 0),
  }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

  // Targets (if single profile)
  let targets = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  let fatRange: { min: number; max: number } | null = null;
  
  if (activeProfile) {
    targets.kcal = activeProfile.dailyKcal || 0;
    
    // Protein logic
    if (activeProfile.nutritionTargets?.proteinMode === 'manual') {
      targets.protein = activeProfile.nutritionTargets.proteinGrams || 0;
    } else if (activeProfile.nutritionTargets?.proteinMode === 'per_kg') {
      targets.protein = (activeProfile.nutritionTargets.proteinPerKg || 0) * (activeProfile.nutritionTargets.bodyWeightKg || 0);
    } else {
      targets.protein = activeProfile.proteinTarget || 0;
    }

    // Fat logic
    if (activeProfile.nutritionTargets?.fatMode === 'range') {
      fatRange = {
        min: activeProfile.nutritionTargets.fatMinGrams || 0,
        max: activeProfile.nutritionTargets.fatMaxGrams || 0
      };
      targets.fat = fatRange.max;
    } else if (activeProfile.nutritionTargets?.fatMode === 'manual') {
      targets.fat = activeProfile.nutritionTargets.fatGrams || 0;
    } else if (activeProfile.nutritionTargets?.fatMode === 'percent') {
      targets.fat = ((activeProfile.nutritionTargets.fatPercent || 0) / 100 * targets.kcal) / 9;
    } else {
      targets.fat = activeProfile.fatTarget || 0;
    }

    // Carbs logic
    if (activeProfile.nutritionTargets?.carbMode === 'manual') {
      targets.carbs = activeProfile.nutritionTargets.carbGrams || 0;
    } else if (activeProfile.nutritionTargets?.carbMode === 'remaining') {
      const pKcal = targets.protein * 4;
      const fKcal = targets.fat * 9;
      targets.carbs = Math.max(0, (targets.kcal - pKcal - fKcal) / 4);
    } else {
      targets.carbs = activeProfile.carbTarget || 0;
    }
  }

  const getStatusColor = (current: number, target: number) => {
    if (target === 0) return 'text-stone-400 bg-stone-50';
    const percent = (current / target) * 100;
    if (percent < 90) return 'text-green-600 bg-green-50';
    if (percent <= 100) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressColor = (current: number, target: number, range?: { min: number, max: number }) => {
    if (target === 0) return 'bg-stone-200';
    
    if (range) {
      if (current < range.min) return 'bg-amber-400';
      if (current <= range.max) return 'bg-natural-primary';
      return 'bg-red-500';
    }

    const percent = (current / target) * 100;
    if (percent < 90) return 'bg-green-500';
    if (percent <= 100) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const remaining = {
    kcal: Math.max(0, targets.kcal - consumed.kcal),
    protein: Math.max(0, targets.protein - consumed.protein),
    fat: Math.max(0, targets.fat - consumed.fat),
    carbs: Math.max(0, targets.carbs - consumed.carbs),
  };

  const moveDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const macros = [
    { label: i18n.macros.protein, val: consumed.protein, target: targets.protein, unit: i18n.common.gramsAbbr, range: null },
    { label: i18n.macros.fat, val: consumed.fat, target: targets.fat, unit: i18n.common.gramsAbbr, range: fatRange },
    { label: i18n.macros.carbs, val: consumed.carbs, target: targets.carbs, unit: i18n.common.gramsAbbr, range: null },
  ];

  return (
    <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm p-6 space-y-6">
      {/* Header: Date & Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => moveDate(-1)} className="p-2 hover:bg-stone-50 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-stone-400" />
          </button>
          <div className="flex items-center space-x-2 px-3 py-2 bg-stone-50 rounded-2xl">
            <Calendar size={16} className="text-natural-primary" />
            <span className="text-sm font-bold text-stone-800">
              {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          <button onClick={() => moveDate(1)} className="p-2 hover:bg-stone-50 rounded-xl transition-colors">
            <ChevronRight size={20} className="text-stone-400" />
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {profiles.length > 1 && (
            <button
              onClick={() => onProfileChange('all')}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedProfileId === 'all'
                  ? 'bg-natural-primary text-white shadow-md'
                  : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
              }`}
            >
              Все
            </button>
          )}
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => onProfileChange(p.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedProfileId === p.id
                  ? 'bg-natural-primary text-white shadow-md'
                  : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
              }`}
            >
              <User size={12} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kcal Card */}
        <div className="bg-natural-primary/5 rounded-[24px] p-6 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-natural-primary/60 mb-1">
                {i18n.diary.remaining}
              </p>
              <h2 className="text-4xl font-serif font-black text-natural-primary">
                {activeProfile ? remaining.kcal : consumed.kcal}
              </h2>
              <p className="text-xs font-bold text-natural-primary/40 mt-1 uppercase tracking-tight">
                {activeProfile ? `${i18n.common.kcalAbbr} до цели ${targets.kcal}` : `${i18n.common.kcalAbbr} всего`}
              </p>
            </div>
            {activeProfile && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-natural-primary/60 mb-1">
                  {i18n.diary.consumed}
                </p>
                <p className="text-xl font-bold text-natural-primary">
                  {consumed.kcal}
                </p>
              </div>
            )}
          </div>
          {activeProfile && targets.kcal > 0 && (
            <div className="mt-4 h-2 bg-white/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getProgressColor(consumed.kcal, targets.kcal)}`}
                style={{ width: `${Math.min(100, (consumed.kcal / targets.kcal) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* PFC Stats */}
        <div className="grid grid-cols-3 gap-3">
          {macros.map((item, idx) => (
            <div key={idx} className="bg-stone-50 rounded-[20px] p-4 flex flex-col justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-1">{item.label}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-base font-black text-stone-800">{Math.round(item.val)}</span>
                  <span className="text-[8px] text-stone-400 px-0.5">{item.unit}</span>
                  {item.range && (
                     <span className="text-[7px] text-stone-400 font-bold whitespace-nowrap">
                       / {item.range.min}–{item.range.max}
                     </span>
                  )}
                </div>
              </div>
              {activeProfile && item.target > 0 && (
                <div className="mt-2 space-y-1">
                   <div className="flex justify-between text-[7px] font-black text-stone-300 uppercase leading-none">
                    {item.range ? (
                      item.val < item.range.min ? (
                        <span className="text-amber-500">+{Math.round(item.range.min - item.val)} г</span>
                      ) : item.val <= item.range.max ? (
                        <span className="text-natural-primary">Норма</span>
                      ) : (
                        <span className="text-red-500">Перебор {Math.round(item.val - item.range.max)}</span>
                      )
                    ) : (
                      <>
                        <span>{Math.round(item.val / item.target * 100)}%</span>
                        <span> ост. {Math.round(Math.max(0, item.target - item.val))}</span>
                      </>
                    )}
                  </div>
                  <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(item.val, item.target, item.range || undefined)}`}
                      style={{ width: `${Math.min(100, (item.val / item.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
