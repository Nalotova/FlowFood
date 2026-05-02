/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DailyNutritionSummary, FoodLogEntry } from '../../types';
import { PieChart, Apple, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { i18n } from '../../i18n/ru';

interface DailySummaryCardProps {
  summary: DailyNutritionSummary;
  entries: FoodLogEntry[];
  onDeleteEntry: (id: string) => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ 
  summary, 
  entries, 
  onDeleteEntry 
}) => {
  const percent = summary.targetKcal ? Math.round((summary.consumedKcal / summary.targetKcal) * 100) : 0;
  
  const unplannedEntries = entries.filter(e => e.type === 'unplanned_snack');

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-100 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-natural-accent rounded-full flex items-center justify-center text-natural-primary shadow-sm">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight">{i18n.foodLog.dailyProgress}</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                {summary.consumedKcal} / {summary.targetKcal || '?'} {i18n.common.kcalAbbr}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-serif font-black text-natural-primary">{percent}%</div>
            <div className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{i18n.profiles.dailyTarget}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {summary.targetKcal && (
          <div className="h-4 bg-stone-100 rounded-full overflow-hidden border border-stone-50 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              className={`h-full rounded-full ${percent > 100 ? 'bg-red-400' : 'bg-natural-primary'}`}
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-stone-50 p-3 rounded-2xl text-center">
            <div className="text-xs font-black text-stone-700">{summary.protein}г</div>
            <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{i18n.common.proteinsAbbr}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl text-center">
            <div className="text-xs font-black text-stone-700">{summary.fat}г</div>
            <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{i18n.common.fatsAbbr}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl text-center">
            <div className="text-xs font-black text-stone-700">{summary.carbs}г</div>
            <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{i18n.common.carbsAbbr}</div>
          </div>
        </div>

        {summary.remainingKcal !== undefined && (
          <div className="flex items-center justify-center py-2 px-4 bg-natural-primary/5 rounded-2xl border border-natural-primary/10">
            <span className="text-[10px] font-black text-natural-primary uppercase tracking-widest mr-2">{i18n.foodLog.remaining}:</span>
            <span className="text-sm font-black text-natural-primary">{summary.remainingKcal} {i18n.common.kcalAbbr}</span>
          </div>
        )}
      </div>

      {unplannedEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-4 flex items-center gap-1">
             <Apple size={10} /> {i18n.foodLog.unplanned}
          </h4>
          <div className="space-y-2">
            {unplannedEntries.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-stone-50 rounded-xl flex items-center justify-center text-xs">
                    🍎
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-700">{entry.foodName}</div>
                    <div className="text-[9px] font-bold text-stone-400 uppercase">
                      {entry.amount} {i18n.fridge.units[entry.unit as keyof typeof i18n.fridge.units] || entry.unit} • {entry.kcal} {i18n.common.kcalAbbr}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-2 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
