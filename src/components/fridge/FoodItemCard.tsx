/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FoodItem } from '../../types/food';
import { Edit2, Trash2, Calendar, Tag, Info, Database, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AmountAdjuster } from './AmountAdjuster';
import { calculateFoodNutrition, formatNutritionValue } from '../../utils/nutrition';

import { i18n } from '../../i18n/ru';

interface FoodItemCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (id: string) => void;
  onAdjust?: (id: string, delta: number) => void;
  onSet?: (id: string, amount: number) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  onAdjust, 
  onSet 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const nutrition = calculateFoodNutrition(item);

  const getEmoji = () => {
    const cats = item.categories;
    if (cats.includes('meat')) return '🍗';
    if (cats.includes('egg') || cats.includes('dairy')) return '🥚';
    if (cats.includes('vegetable')) return '🥦';
    if (cats.includes('fruit')) return '🍎';
    if (cats.includes('fish')) return '🐟';
    if (cats.includes('grain')) return '🌾';
    if (cats.includes('ready_meal')) return '🍱';
    return '📦';
  };

  const getCategoryLabel = (cat: string) => {
    return i18n.fridge.categories[cat as keyof typeof i18n.fridge.categories] || cat;
  };

  const getStateLabel = (state: string) => {
    return i18n.fridge.states[state as keyof typeof i18n.fridge.states] || state;
  };

  const getSourceLabel = (source: string) => {
    return i18n.fridge.sources[source as keyof typeof i18n.fridge.sources] || source;
  };

  const getUnitLabel = (unit: string) => {
    return i18n.fridge.units[unit as keyof typeof i18n.fridge.units] || unit;
  };

  const needsReview = (item.confidenceScore ?? 1) < 0.7 || !item.kcalPer100g;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-[32px] border border-stone-100 shadow-sm transition-all hover:shadow-md group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-xl border border-stone-100 shrink-0">
            {getEmoji()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-stone-800 text-sm truncate">{item.name}</h3>
              {needsReview && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
            </div>
            {item.brand && <p className="text-[10px] font-bold text-stone-400 truncate">{item.brand}</p>}
            <p className="text-[10px] font-black text-natural-primary uppercase tracking-widest mt-0.5">
              {item.amount} {getUnitLabel(item.unit)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-1 sm:flex-row">
            {typeof onEdit === 'function' && (
              <button 
                onClick={() => onEdit(item)}
                className="p-2 text-stone-300 hover:text-natural-primary transition-colors bg-stone-50 rounded-xl"
              >
                <Edit2 size={14} />
              </button>
            )}
            {typeof onDelete === 'function' && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors bg-stone-50 rounded-xl active:scale-95"
                title={i18n.common.delete}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl transition-all ${
              isExpanded ? 'bg-natural-primary text-white' : 'bg-stone-50 text-stone-400'
            }`}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Amount Adjuster */}
              <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Изменить остаток</span>
                <AmountAdjuster 
                  amount={item.amount} 
                  unit={item.unit} 
                  onAdjust={(delta) => onAdjust?.(item.id, delta)} 
                  onSet={(val) => onSet?.(item.id, val)} 
                />
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                  <div className="text-[8px] font-black text-stone-400 uppercase mb-2">КБЖУ / 100г</div>
                  <div className="text-xs font-black text-stone-700 mb-2">{item.kcalPer100g} {i18n.common.kcalAbbr}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase">
                      <span>{i18n.common.proteinsAbbr}</span>
                      <span>{formatNutritionValue(item.proteinPer100g)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase">
                      <span>{i18n.common.fatsAbbr}</span>
                      <span>{formatNutritionValue(item.fatPer100g)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-stone-500 uppercase">
                      <span>{i18n.common.carbsAbbr}</span>
                      <span>{formatNutritionValue(item.carbsPer100g)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100 space-y-3">
                  <div>
                    <div className="text-[8px] font-black text-stone-400 uppercase mb-1">Категории</div>
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map(cat => (
                        <span key={cat} className="text-[8px] font-black bg-white text-stone-500 px-1.5 py-0.5 rounded shadow-sm uppercase">
                          {getCategoryLabel(cat)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-stone-400 uppercase mb-1">Состояние</div>
                    <span className="text-[8px] font-black bg-natural-primary/10 text-natural-primary px-1.5 py-0.5 rounded uppercase">
                      {getStateLabel(item.state)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extra Info */}
              <div className="flex flex-wrap gap-3 text-[10px] font-bold text-stone-400">
                {item.expirationDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-stone-300" />
                    <span>До: {item.expirationDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Database size={12} className="text-stone-300" />
                  <span>{getSourceLabel(item.source)} {(item.confidenceScore ?? 0) > 0 && `(${Math.round(item.confidenceScore! * 100)}%)`}</span>
                </div>
                {item.notes && (
                  <div className="w-full flex items-start gap-1.5 bg-stone-50 p-2 rounded-xl italic">
                    <Info size={12} className="text-stone-300 shrink-0 mt-0.5" />
                    <span className="leading-tight">{item.notes}</span>
                  </div>
                )}
              </div>
              
              {needsReview && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold text-amber-600">
                  <AlertTriangle size={14} />
                  <span>Данные продукта требуют проверки</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
