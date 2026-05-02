/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InventoryMovement } from '../../types/cooking';
import { Box } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface InventoryAfterTableProps {
  movements: InventoryMovement[];
}

export const InventoryAfterTable: React.FC<InventoryAfterTableProps> = ({ movements }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-1">
        <Box size={10} /> {i18n.cooking.inventoryAfter}
      </h4>
      <div className="bg-white rounded-[32px] border border-stone-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50">
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest">{i18n.fridge.product}</th>
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest text-right">{i18n.cooking.was}</th>
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest text-right">{i18n.cooking.spent}</th>
                <th className="px-5 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest text-right">{i18n.cooking.remaining}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {movements.map((move) => (
                <tr key={move.foodItemId} className="group">
                  <td className="px-5 py-4">
                    <div className="text-xs font-bold text-stone-700">{move.foodName}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[10px] font-bold text-stone-400">{move.currentAmount} {i18n.fridge.units[move.unit as keyof typeof i18n.fridge.units] || move.unit}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[10px] font-black text-red-400">-{move.usedAmount}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className={`text-xs font-black ${move.remainingAmount === 0 ? 'text-orange-500' : 'text-natural-primary'}`}>
                      {move.remainingAmount} {i18n.fridge.units[move.unit as keyof typeof i18n.fridge.units] || move.unit}
                    </div>
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
