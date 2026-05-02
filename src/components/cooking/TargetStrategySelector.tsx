/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TargetStrategy } from '../../types/cooking';
import { Calendar, Target } from 'lucide-react';

import { i18n } from '../../i18n/ru';

interface TargetStrategySelectorProps {
  value: TargetStrategy;
  onChange: (value: TargetStrategy) => void;
}

export const TargetStrategySelector: React.FC<TargetStrategySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.strategy}</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('planned_meal_kcal')}
          className={`flex flex-col space-y-1 p-4 rounded-2xl border transition-all text-left ${
            value === 'planned_meal_kcal'
              ? 'bg-white border-natural-primary shadow-md'
              : 'bg-white text-stone-500 border-stone-100 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar size={14} className={value === 'planned_meal_kcal' ? 'text-natural-primary' : ''} />
            <span className="text-[10px] font-black uppercase tracking-wider">{i18n.cooking.strategies.planned_meal_kcal}</span>
          </div>
          <p className="text-[9px] text-stone-400 leading-tight">Стандартная норма для этого приёма пищи</p>
        </button>
        <button
          type="button"
          onClick={() => onChange('adapt_to_remaining_day')}
          className={`flex flex-col space-y-1 p-4 rounded-2xl border transition-all text-left ${
            value === 'adapt_to_remaining_day'
              ? 'bg-white border-natural-primary shadow-md'
              : 'bg-white text-stone-500 border-stone-100 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Target size={14} className={value === 'adapt_to_remaining_day' ? 'text-natural-primary' : ''} />
            <span className="text-[10px] font-black uppercase tracking-wider">{i18n.cooking.strategies.adapt_to_remaining_day}</span>
          </div>
          <p className="text-[9px] text-stone-400 leading-tight">Учитывать уже съеденное за день</p>
        </button>
      </div>
    </div>
  );
};
