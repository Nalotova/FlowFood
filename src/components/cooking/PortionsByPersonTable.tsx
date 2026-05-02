/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MealPortion } from '../../types/cooking';
import { User, Zap } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface PortionsByPersonTableProps {
  portions: MealPortion[];
}

export const PortionsByPersonTable: React.FC<PortionsByPersonTableProps> = ({ portions }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-1">
        <User size={10} /> {i18n.cooking.portions}
      </h4>
      <div className="grid grid-cols-1 gap-4">
        {portions.map((portion) => (
          <div key={portion.profileId} className="bg-white p-5 rounded-[32px] border border-stone-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-50 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black uppercase text-stone-500">
                  {portion.profileName.charAt(0)}
                </div>
                <span className="text-xs font-black text-stone-800">{portion.profileName}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-natural-primary">{portion.actualKcal} / {portion.targetKcal} {i18n.common.kcalAbbr}</div>
                <div className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{i18n.cooking.factTarget}</div>
              </div>
            </div>

            <div className="space-y-2">
              {portion.items.map((item, idx) => (
                <div key={`${portion.profileId}-${item.foodItemId || item.foodName}-${idx}`} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-natural-accent" />
                    <span className="text-[11px] font-bold text-stone-600">{item.foodName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black text-stone-800">{item.amount} {i18n.fridge.units[item.unit as keyof typeof i18n.fridge.units] || item.unit}</span>
                    <span className="text-[9px] font-bold text-stone-400 ml-2">({item.grams}{i18n.common.gramsAbbr})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-1 text-[8px] font-black text-stone-400 uppercase tracking-widest">
                <Zap size={10} /> {i18n.cooking.totalPFC}
              </div>
              <div className="flex space-x-3">
                <div className="text-center">
                  <div className="text-[10px] font-black text-stone-700">{portion.totals.protein}г</div>
                  <div className="text-[8px] font-bold text-stone-400 uppercase">{i18n.common.proteinsAbbr}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-stone-700">{portion.totals.fat}г</div>
                  <div className="text-[8px] font-bold text-stone-400 uppercase">{i18n.common.fatsAbbr}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-stone-700">{portion.totals.carbs}г</div>
                  <div className="text-[8px] font-bold text-stone-400 uppercase">{i18n.common.carbsAbbr}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
