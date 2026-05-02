/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { FoodCategory } from '../../types/food';
import { motion, AnimatePresence } from 'motion/react';

import { i18n } from '../../i18n/ru';

interface FridgeFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: FoodCategory | 'all';
  onCategoryChange: (cat: FoodCategory | 'all') => void;
}

export const FridgeFilters: React.FC<FridgeFiltersProps> = ({ 
  search, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const categories: (FoodCategory | 'all')[] = [
    'all', "protein", "meat", "egg", "dairy", "vegetable", "fruit", "carb", "grain", "ready_meal", "other"
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск продуктов..."
            className="w-full bg-natural-muted border border-stone-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none placeholder:text-stone-300 shadow-sm"
          />
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 rounded-2xl border flex items-center gap-2 transition-all ${
            isExpanded || selectedCategory !== 'all'
              ? 'bg-natural-primary text-white border-natural-primary'
              : 'bg-white text-stone-400 border-stone-100'
          }`}
        >
          <Filter size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{i18n.common.filters}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 py-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter border transition-all ${
                    selectedCategory === cat
                      ? 'bg-natural-primary text-white border-natural-primary'
                      : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200 shadow-xs'
                  }`}
                >
                  {cat === 'all' ? 'Все' : (i18n.fridge.categories[cat as keyof typeof i18n.fridge.categories] || cat)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
