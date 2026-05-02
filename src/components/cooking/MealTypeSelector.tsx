/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MealType } from '../../types/cooking';
import { Coffee, Sun, Apple, Moon } from 'lucide-react';

import { i18n } from '../../i18n/ru';

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

export const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({ value, onChange }) => {
  const options: { id: MealType; label: string; icon: React.ReactNode }[] = [
    { id: 'breakfast', label: i18n.cooking.mealTypes.breakfast, icon: <Coffee size={18} /> },
    { id: 'lunch', label: i18n.cooking.mealTypes.lunch, icon: <Sun size={18} /> },
    { id: 'snack', label: i18n.cooking.mealTypes.snack, icon: <Apple size={18} /> },
    { id: 'dinner', label: i18n.cooking.mealTypes.dinner, icon: <Moon size={18} /> },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.mealType}</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${
              value === opt.id
                ? 'bg-natural-primary text-white border-natural-primary shadow-md'
                : 'bg-white text-stone-500 border-stone-100 hover:bg-stone-50'
            }`}
          >
            <div className={value === opt.id ? 'text-white' : 'text-natural-primary'}>{opt.icon}</div>
            <span className="text-xs font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
