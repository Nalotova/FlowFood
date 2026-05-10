/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, User, Clock, Utensils, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodLogEntry } from '../../types/foodLog';
import { i18n } from '../../i18n/ru';

interface FoodLogEntryCardProps {
  entry: FoodLogEntry;
  onDelete?: () => void;
  canEdit?: boolean;
}

export const FoodLogEntryCard: React.FC<FoodLogEntryCardProps> = ({ entry, onDelete, canEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const snapshot = entry.sourceCookingResultSnapshot;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden transition-all group"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 flex items-center space-x-4 cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          entry.type === 'planned_meal' ? 'bg-natural-accent text-natural-primary' : 'bg-stone-50 text-stone-400'
        }`}>
          {entry.type === 'planned_meal' ? <div className="text-lg">🍲</div> : <Clock size={20} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 mb-0.5">
            <User size={10} className="text-stone-300" />
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter truncate">
              {entry.profileName}
            </span>
            <span className="text-[10px] text-stone-200 px-1">•</span>
            <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
              {entry.mealType ? i18n.cooking.mealTypes[entry.mealType] : i18n.foodLog.types[entry.type as keyof typeof i18n.foodLog.types]}
            </span>
          </div>
          <h4 className="font-bold text-stone-800 text-sm truncate">{entry.foodName}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[10px] font-black text-natural-primary bg-natural-primary/5 px-2 py-0.5 rounded-full">
              {entry.kcal} {i18n.common.kcalAbbr}
            </span>
            <span className="text-[8px] font-bold text-stone-300 uppercase">
              Б:{Math.round(entry.protein)} Ж:{Math.round(entry.fat)} У:{Math.round(entry.carbs)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-2 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="text-stone-300">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-50 bg-stone-50/30"
          >
            <div className="p-6 space-y-6">
              {/* Detailed Macros */}
              <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                <div className="text-center">
                   <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{i18n.common.kcalAbbr}</p>
                   <p className="text-sm font-black text-stone-800">{entry.kcal}</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Белки</p>
                   <p className="text-sm font-black text-stone-800">{entry.protein}г</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Жиры</p>
                   <p className="text-sm font-black text-stone-800">{entry.fat}г</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Углеводы</p>
                   <p className="text-sm font-black text-stone-800">{entry.carbs}г</p>
                </div>
              </div>

              {snapshot && (
                <div className="space-y-4">
                  {snapshot.explanation && (
                    <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-2 text-natural-primary">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Описание</span>
                      </div>
                      <p className="text-xs text-stone-600 italic leading-relaxed">"{snapshot.explanation}"</p>
                    </div>
                  )}

                  {snapshot.portionItems && (
                    <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3 text-natural-primary">
                        <Utensils size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ингредиенты порции</span>
                      </div>
                      <div className="space-y-2">
                        {snapshot.portionItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="text-stone-600 font-medium">{item.foodName}</span>
                            <span className="text-stone-400">{item.amount} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {snapshot.recipe && (
                    <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3 text-natural-primary">
                        <Utensils size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Рецепт</span>
                      </div>
                      <div className="space-y-3">
                        {snapshot.recipe.steps.map((step, idx) => (
                          <div key={idx} className="flex space-x-3">
                            <span className="w-5 h-5 rounded-lg bg-natural-primary/5 text-natural-primary flex items-center justify-center text-[10px] font-black shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-[11px] text-stone-600 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {snapshot.warnings && snapshot.warnings.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-3xl border border-red-100/50">
                       <div className="flex items-center space-x-2 mb-2 text-red-500">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Внимание</span>
                      </div>
                      <div className="space-y-1">
                        {snapshot.warnings.map((w, idx) => (
                          <p key={idx} className="text-[10px] text-red-700 font-bold">• {w}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {entry.notes && (
                <div className="bg-stone-100/50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Заметки</p>
                  <p className="text-xs text-stone-600">{entry.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between items-end pt-2 border-t border-stone-100">
                 <div className="text-[9px] font-black text-stone-300 uppercase tracking-widest">
                   {entry.grams}г • {i18n.fridge.units[entry.unit as keyof typeof i18n.fridge.units] || entry.unit}
                 </div>
                 <div className="text-[9px] font-black text-stone-300 uppercase tracking-widest">
                   Списано: {entry.subtractFromFridge ? 'Да' : 'Нет'}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
