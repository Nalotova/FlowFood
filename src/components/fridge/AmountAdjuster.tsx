/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus, Hash } from 'lucide-react';

interface AmountAdjusterProps {
  amount: number;
  unit: string;
  onAdjust: (delta: number) => void;
  onSet: (amount: number) => void;
}

export const AmountAdjuster: React.FC<AmountAdjusterProps> = ({ 
  amount, 
  unit, 
  onAdjust, 
  onSet 
}) => {
  const handleSetExact = () => {
    const val = prompt(`Введите точный остаток (${unit}):`, (amount ?? 0).toString());
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        onSet(num);
      }
    }
  };

  return (
    <div className="flex items-center space-x-1.5 pt-2">
      <button 
        onClick={() => onAdjust(-1)}
        className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Minus size={14} strokeWidth={3} />
      </button>
      
      <button 
        onClick={handleSetExact}
        className="min-w-16 px-2 h-8 flex items-center justify-center bg-white border border-stone-100 rounded-lg shadow-xs hover:bg-stone-50 transition-colors"
      >
        <span className="text-[10px] font-black text-natural-primary">{amount} {unit}</span>
      </button>

      <button 
        onClick={() => onAdjust(1)}
        className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-500 rounded-full hover:bg-green-50 hover:text-green-500 transition-colors"
      >
        <Plus size={14} strokeWidth={3} />
      </button>
      
      <button 
        onClick={handleSetExact}
        className="p-1.5 text-stone-300 hover:text-natural-primary transition-colors"
        title="Установить точный остаток"
      >
        <Hash size={16} />
      </button>
    </div>
  );
};
