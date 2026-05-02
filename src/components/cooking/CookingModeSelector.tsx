/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CookingMode } from '../../types/cooking';
import { Layers, LayoutGrid } from 'lucide-react';

import { i18n } from '../../i18n/ru';

interface CookingModeSelectorProps {
  value: CookingMode;
  onChange: (value: CookingMode) => void;
}

export const CookingModeSelector: React.FC<CookingModeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.mode}</h4>
      <div className="flex bg-stone-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => onChange('same_dish_different_portions')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
            value === 'same_dish_different_portions'
              ? 'bg-white text-natural-primary shadow-sm font-bold'
              : 'text-stone-400 hover:text-stone-500'
          }`}
        >
          <Layers size={14} />
          <span className="text-[10px] uppercase tracking-wider">{i18n.cooking.modes.same_dish_different_portions}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('separate_dishes')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
            value === 'separate_dishes'
              ? 'bg-white text-natural-primary shadow-sm font-bold'
              : 'text-stone-400 hover:text-stone-500'
          }`}
        >
          <LayoutGrid size={14} />
          <span className="text-[10px] uppercase tracking-wider">{i18n.cooking.modes.separate_dishes}</span>
        </button>
      </div>
    </div>
  );
};
