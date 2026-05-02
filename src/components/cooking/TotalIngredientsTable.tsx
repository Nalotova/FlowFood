/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IngredientAmount } from '../../types/cooking';
import { ShoppingCart } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface TotalIngredientsTableProps {
  ingredients: IngredientAmount[];
}

export const TotalIngredientsTable: React.FC<TotalIngredientsTableProps> = ({ ingredients }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-1">
        <ShoppingCart size={10} /> {i18n.cooking.totalIngredients}
      </h4>
      <div className="bg-stone-50 rounded-[32px] border border-stone-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-100/50">
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest">{i18n.fridge.product}</th>
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest text-right">{i18n.foodLog.amount}</th>
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest text-right">{i18n.common.kcalAbbr}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ingredients.map((item) => (
                <tr key={item.foodItemId} className="bg-white/50">
                  <td className="px-5 py-4">
                    <div className="text-xs font-bold text-stone-700">{item.foodName}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-xs font-black text-natural-primary">{item.totalAmount} {i18n.fridge.units[item.unit as keyof typeof i18n.fridge.units] || item.unit}</div>
                    {item.totalGrams !== item.totalAmount && (
                      <div className="text-[8px] font-bold text-stone-400 uppercase">~{item.totalGrams} {i18n.common.gramsAbbr}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[10px] font-bold text-stone-500">{item.kcal} {i18n.common.kcalAbbr}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
