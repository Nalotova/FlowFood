/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, ShoppingCart, Info, Copy, X } from 'lucide-react';
import { DishFeasibility } from '../../types/dishPlanning';
import { useAppUI } from '../../contexts/AppUIContext';
import { i18n } from '../../i18n/ru';

interface DishFeasibilityCardProps {
  feasibility: DishFeasibility;
  onCookAnyway: () => void;
  onCookWithSubstitutes: () => void;
  onCancel: () => void;
  onSuggestAlternative: () => void;
}

export const DishFeasibilityCard: React.FC<DishFeasibilityCardProps> = ({
  feasibility,
  onCookAnyway,
  onCookWithSubstitutes,
  onCancel,
  onSuggestAlternative
}) => {
  const { showToast } = useAppUI();
  const isCanMake = feasibility.status === 'can_make';
  const isModified = feasibility.status === 'can_make_modified';
  const isNeedsShopping = feasibility.status === 'needs_shopping';
  const isCannotMake = feasibility.status === 'cannot_make';

  const copyShoppingList = () => {
    const list = feasibility.shoppingList
      .map(item => `- ${item.name}${item.amount ? ` ${item.amount}${item.unit || ''}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(list);
    showToast(i18n.cooking.shoppingListCopied, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] p-6 shadow-xl border border-stone-100 space-y-6"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-natural-primary">{feasibility.dishName}</h3>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-tight">
            {i18n.cooking.dishFeasibility}
          </p>
        </div>
        <button onClick={onCancel} className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className={`p-4 rounded-2xl flex items-start space-x-3 ${
        isCanMake ? 'bg-green-50 text-green-700' :
        isModified ? 'bg-natural-primary/5 text-natural-primary' :
        isNeedsShopping ? 'bg-amber-50 text-amber-700' :
        'bg-red-50 text-red-700'
      }`}>
        <div className="mt-0.5">
          {isCanMake ? <CheckCircle2 size={18} /> :
           isModified ? <CheckCircle2 size={18} /> :
           isNeedsShopping ? <ShoppingCart size={18} /> :
           <AlertCircle size={18} />}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold leading-snug">{i18n.cooking.feasibilityStatus[feasibility.status]}</p>
          <p className="text-[10px] font-medium opacity-80">{feasibility.message}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Available Ingredients */}
        {feasibility.availableIngredients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-500" />
              {i18n.cooking.availableIngredients}
            </h4>
            <div className="flex flex-wrap gap-2">
              {feasibility.availableIngredients.map((ing, i) => (
                <div key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-100 italic">
                  {ing.matchedFoodName || ing.requiredIngredient.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Ingredients */}
        {feasibility.missingIngredients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <AlertCircle size={10} className="text-amber-500" />
              {i18n.cooking.missingIngredients}
            </h4>
            <div className="space-y-1.5">
              {feasibility.missingIngredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-bold text-stone-600">{ing.requiredIngredient.name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                    ing.requiredIngredient.importance === 'required' ? 'bg-red-100 text-red-600' : 'bg-stone-200 text-stone-500'
                  }`}>
                    {ing.requiredIngredient.importance}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Substitutions */}
        {feasibility.suggestedSubstitutions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Info size={10} className="text-natural-primary" />
              {i18n.cooking.substitutions}
            </h4>
            <div className="space-y-1.5">
              {feasibility.suggestedSubstitutions.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-600">
                    {sub.requiredIngredient.name} → <span className="text-natural-primary">{sub.substituteFoodName}</span>
                  </span>
                  <span className="text-[8px] font-black text-natural-primary uppercase italic">Замена</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shopping List */}
        {feasibility.shoppingList.length > 0 && (
          <div className="pt-2">
            <div className="p-4 bg-stone-900 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                  <ShoppingCart size={14} className="text-amber-400" />
                  {i18n.cooking.shoppingList}
                </h4>
                <button 
                  onClick={copyShoppingList}
                  className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  <Copy size={12} />
                  {i18n.cooking.copyShoppingList}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {feasibility.shoppingList.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                    <span className="text-[11px] font-medium text-stone-300">{item.name}</span>
                    <span className="text-[11px] font-bold text-white">{item.amount} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-stone-100">
        {!isCannotMake && (
          <button
            onClick={feasibility.suggestedSubstitutions.length > 0 ? onCookWithSubstitutes : onCookAnyway}
            className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-natural-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {feasibility.suggestedSubstitutions.length > 0 ? i18n.cooking.cookWithSubstitutes : i18n.cooking.cookWhatIsAvailable}
          </button>
        )}
        
        {isCannotMake && (
          <button
            onClick={onSuggestAlternative}
            className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-natural-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {i18n.cooking.suggestAlternative}
          </button>
        )}

        <button
          onClick={onCancel}
          className="w-full py-4 bg-stone-100 text-stone-500 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-stone-200 transition-colors"
        >
          {i18n.common.cancel}
        </button>
      </div>
    </motion.div>
  );
};
