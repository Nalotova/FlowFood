/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CookingResult } from '../../types/cooking';
import { X, ChefHat, Info, AlertTriangle, Target, Clock, Utensils, User } from 'lucide-react';
import { i18n } from '../../i18n/ru';
import { motion, AnimatePresence } from 'motion/react';
import { TotalIngredientsTable } from './TotalIngredientsTable';
import { PortionsByPersonTable } from './PortionsByPersonTable';

interface RecipeDetailModalProps {
  result: CookingResult;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ result, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        id="recipe-detail-modal"
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-natural-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-natural-primary/20">
              <ChefHat size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-800 leading-tight">
                {result.mealName}
              </h2>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {new Date(result.createdAt).toLocaleDateString('ru-RU')} • {i18n.cooking.mealTypes[result.mealType as keyof typeof i18n.cooking.mealTypes] || result.mealType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-stone-100 text-stone-400 rounded-2xl hover:bg-stone-200 hover:text-stone-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-12">
          {/* Explanation / Intro */}
          <div className="bg-stone-50 rounded-[32px] p-6 border border-stone-100 italic text-stone-600 text-sm leading-relaxed">
            {result.explanation || "Детали этого блюда."}
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-100 text-center">
              <div className="text-[8px] font-black text-stone-300 uppercase mb-1">Всего Ккал</div>
              <div className="text-sm font-black text-natural-primary">
                {Math.round(result.portions.reduce((sum, p) => sum + p.actualKcal, 0))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-100 text-center">
              <div className="text-[8px] font-black text-stone-300 uppercase mb-1">Белки</div>
              <div className="text-sm font-black">
                {Math.round(result.portions.reduce((sum, p) => sum + p.totals.protein, 0))}г
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-100 text-center">
              <div className="text-[8px] font-black text-stone-300 uppercase mb-1">Жиры</div>
              <div className="text-sm font-black">
                {Math.round(result.portions.reduce((sum, p) => sum + p.totals.fat, 0))}г
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-100 text-center">
              <div className="text-[8px] font-black text-stone-300 uppercase mb-1">Углеводы</div>
              <div className="text-sm font-black">
                {Math.round(result.portions.reduce((sum, p) => sum + p.totals.carbs, 0))}г
              </div>
            </div>
          </div>

          {/* Recipe Section */}
          {result.recipe && (
             <div className="space-y-4">
               <div className="flex items-center gap-2 px-2">
                 <Utensils size={16} className="text-natural-primary" />
                 <h3 className="font-serif font-bold text-lg text-stone-800">{i18n.cooking.recipe}</h3>
               </div>
               <div className="bg-white border border-stone-100 rounded-[32px] overflow-hidden">
                 <div className="p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     {result.recipe.prepTime && (
                       <div className="flex items-center gap-2">
                         <Clock size={14} className="text-stone-300" />
                         <span className="text-[10px] font-bold text-stone-400 uppercase">{i18n.cooking.prepTime}: {result.recipe.prepTime}</span>
                       </div>
                     )}
                     {result.recipe.cookTime && (
                       <div className="flex items-center gap-2">
                         <Clock size={14} className="text-stone-300" />
                         <span className="text-[10px] font-bold text-stone-400 uppercase">{i18n.cooking.cookTime}: {result.recipe.cookTime}</span>
                       </div>
                     )}
                   </div>
                   
                   <div className="space-y-4 pt-2">
                     {result.recipe.steps.map((step, idx) => (
                       <div key={idx} className="flex gap-4 group">
                         <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0 group-hover:bg-natural-primary/10 group-hover:text-natural-primary transition-colors">
                           {idx + 1}
                         </div>
                         <p className="text-xs text-stone-700 leading-relaxed pt-0.5">{step}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* Ingredients */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Target size={16} className="text-natural-primary" />
              <h3 className="font-serif font-bold text-lg text-stone-800">{i18n.cooking.totalIngredients}</h3>
            </div>
            <TotalIngredientsTable ingredients={result.totalIngredients} />
          </div>

          {/* Portions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <User size={16} className="text-natural-primary" />
              <h3 className="font-serif font-bold text-lg text-stone-800">{i18n.cooking.portions}</h3>
            </div>
            <PortionsByPersonTable portions={result.portions} />
          </div>

          {result.warnings.length > 0 && (
            <div className="space-y-3 pt-2">
               <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 flex items-center gap-2">
                 <AlertTriangle size={12} /> {i18n.cooking.warnings}
               </h4>
               <div className="space-y-2">
                 {result.warnings.map((w, idx) => (
                   <div key={idx} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-700 leading-relaxed">
                     {w}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
