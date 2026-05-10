/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FoodItem } from '../../types/food';
import { ThumbsUp, ThumbsDown, Package, Search, X } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface FoodPreferenceSelectorProps {
  foodItems: FoodItem[];
  preferredIds: string[];
  excludedIds: string[];
  onPreferenceChange: (preferred: string[], excluded: string[]) => void;
}

export const FoodPreferenceSelector: React.FC<FoodPreferenceSelectorProps> = ({
  foodItems,
  preferredIds,
  excludedIds,
  onPreferenceChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const availableItems = foodItems.filter(f => f.amount > 0);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredItems = availableItems.filter(item => {
    if (!normalizedQuery) return true;

    return [
      item.name,
      item.brand,
      item.notes,
      ...(item.categories || [])
    ]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalizedQuery));
  });

  const togglePreference = (id: string, type: 'preferred' | 'excluded') => {
    let newPreferred = [...preferredIds];
    let newExcluded = [...excludedIds];

    if (type === 'preferred') {
      if (newPreferred.includes(id)) {
        newPreferred = newPreferred.filter(idx => idx !== id);
      } else {
        newPreferred.push(id);
        newExcluded = newExcluded.filter(idx => idx !== id);
      }
    } else {
      if (newExcluded.includes(id)) {
        newExcluded = newExcluded.filter(idx => idx !== id);
      } else {
        newExcluded.push(id);
        newPreferred = newPreferred.filter(idx => idx !== id);
      }
    }

    onPreferenceChange(newPreferred, newExcluded);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.fridgeProducts}</h4>
      
      {availableItems.length > 0 && (
        <div className="relative px-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
          <input
            type="text"
            placeholder="Найти продукт..."
            className="w-full pl-9 pr-9 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-natural-primary/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {availableItems.length > 0 && (
        <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-2">
          {searchQuery ? `Найдено: ${filteredItems.length} из ${availableItems.length}` : `Доступно: ${availableItems.length}`}
        </div>
      )}

      <div className="bg-stone-50 rounded-[32px] border border-stone-100 overflow-hidden">
        <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 no-scrollbar">
          {availableItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Package className="mx-auto text-stone-200" size={32} />
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{i18n.cooking.fridgeEmpty}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs font-bold text-stone-700">Ничего не найдено</p>
              <p className="text-[10px] text-stone-400">Попробуйте другое название продукта.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {item.categories.includes('meat') ? '🍗' : item.categories.includes('vegetable') ? '🥦' : '📦'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-stone-700">{item.name}</div>
                    <div className="text-[9px] font-bold text-stone-400 uppercase">{item.amount} {i18n.fridge.units[item.unit as keyof typeof i18n.fridge.units] || item.unit}</div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => togglePreference(item.id, 'preferred')}
                    className={`p-2 rounded-xl transition-all ${
                      preferredIds.includes(item.id)
                        ? 'bg-green-100 text-green-600 border border-green-200'
                        : 'bg-white text-stone-300 border border-stone-100 hover:border-stone-200'
                    }`}
                    title={i18n.cooking.mustUse}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePreference(item.id, 'excluded')}
                    className={`p-2 rounded-xl transition-all ${
                      excludedIds.includes(item.id)
                        ? 'bg-red-100 text-red-600 border border-red-200'
                        : 'bg-white text-stone-300 border border-stone-100 hover:border-stone-200'
                    }`}
                    title={i18n.cooking.dontUse}
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
