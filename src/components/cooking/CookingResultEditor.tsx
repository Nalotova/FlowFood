/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Save, Trash2, Plus, AlertCircle, Info, Hash } from 'lucide-react';
import { CookingResult, MealPortion, MealPortionItem } from '../../types/cooking';
import { FoodItem } from '../../types/food';
import { UserProfile } from '../../types/profile';
import { recalculateCookingResultFromPortions } from '../../utils/cookingRecalculation';
import { validateCookingResult } from '../../utils/cookingValidation';
import { calculateFoodNutrition } from '../../utils/nutrition';
import { i18n } from '../../i18n/ru';

interface CookingResultEditorProps {
  result: CookingResult;
  foodItems: FoodItem[];
  profiles: UserProfile[];
  onSave: (updatedResult: CookingResult) => void;
  onCancel: () => void;
}

export const CookingResultEditor: React.FC<CookingResultEditorProps> = ({
  result,
  foodItems,
  profiles,
  onSave,
  onCancel
}) => {
  const [editedResult, setEditedResult] = useState<CookingResult>(result);
  const [addingToPortion, setAddingToPortion] = useState<number | null>(null);

  // Recalculate on any portion change
  const handlePortionChange = (updatedPortions: MealPortion[]) => {
    const intermediateResult = {
      ...editedResult,
      portions: updatedPortions
    };
    const recalculated = recalculateCookingResultFromPortions(intermediateResult, foodItems);
    const report = validateCookingResult(recalculated, foodItems, profiles);
    setEditedResult({
      ...recalculated,
      validationReport: report
    });
  };

  const handleUpdateItemAmount = (portionIndex: number, itemIndex: number, newAmount: number) => {
    const updatedPortions = [...editedResult.portions];
    const portion = { ...updatedPortions[portionIndex] };
    const items = [...portion.items];
    const item = { ...items[itemIndex] };

    item.amount = Math.max(0, newAmount);
    items[itemIndex] = item;
    portion.items = items;
    updatedPortions[portionIndex] = portion;

    handlePortionChange(updatedPortions);
  };

  const handleRemoveItem = (portionIndex: number, itemIndex: number) => {
    const updatedPortions = [...editedResult.portions];
    const portion = { ...updatedPortions[portionIndex] };
    const items = portion.items.filter((_, i) => i !== itemIndex);

    portion.items = items;
    updatedPortions[portionIndex] = portion;

    handlePortionChange(updatedPortions);
  };

  const handleAddItem = (portionIndex: number, foodItemId: string) => {
    const food = foodItems.find(f => f.id === foodItemId);
    if (!food) return;

    const updatedPortions = [...editedResult.portions];
    const portion = { ...updatedPortions[portionIndex] };
    
    // Default amount: 1 for pieces/packages, 10 for g/ml
    const defaultAmount = (food.unit === 'piece' || food.unit === 'package') ? 1 : 10;
    const nutrition = calculateFoodNutrition(food, defaultAmount);

    const newItem: MealPortionItem = {
      foodItemId: food.id,
      foodName: food.name,
      amount: defaultAmount,
      unit: food.unit,
      grams: 0, // Will be filled by recalculate
      ...nutrition
    };

    portion.items = [...portion.items, newItem];
    updatedPortions[portionIndex] = portion;

    handlePortionChange(updatedPortions);
    setAddingToPortion(null);
  };

  const availableFood = foodItems.filter(f => f.amount > 0);

  return (
    <div className="fixed inset-0 z-[70] bg-white overflow-y-auto no-scrollbar pb-32">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-serif font-bold text-natural-primary">{i18n.common.edit}</h2>
        <button 
          onClick={() => onSave(editedResult)}
          className="p-2 text-natural-primary hover:scale-110 transition-all"
        >
          <Save size={24} />
        </button>
      </div>

      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        {/* Meal Name */}
        <section className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.mealIdea}</h4>
          <input
            value={editedResult.mealName}
            onChange={(e) => setEditedResult({ ...editedResult, mealName: e.target.value })}
            className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-sm font-bold text-natural-primary focus:ring-2 focus:ring-natural-primary/10 outline-none"
          />
        </section>

        {/* Portions */}
        <section className="space-y-6">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.portions}</h4>
          {editedResult.portions.map((portion, pIdx) => (
            <div key={portion.profileId} className="bg-stone-50 rounded-[32px] p-6 border border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-serif font-bold text-stone-700">{portion.profileName}</h5>
                <div className="text-[10px] font-black text-natural-primary uppercase tracking-widest">
                  {i18n.cooking.kcalTarget}: {portion.targetKcal} {i18n.common.kcalAbbr}
                </div>
              </div>

              <div className="space-y-3">
                {portion.items.map((item, iIdx) => (
                  <div key={`${item.foodItemId}-${iIdx}`} className="bg-white rounded-2xl p-4 border border-stone-100 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-800">{item.foodName}</p>
                      <div className="flex gap-2 mt-1">
                         <span className="text-[9px] text-stone-400 font-bold uppercase">{item.kcal} {i18n.common.kcalAbbr}</span>
                         <span className="text-[9px] text-stone-400 font-bold uppercase">
                           {i18n.common.proteinsAbbr}:{item.protein} {i18n.common.fatsAbbr}:{item.fat} {i18n.common.carbsAbbr}:{item.carbs}
                         </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-stone-50 rounded-xl border border-stone-100 px-2 py-1">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleUpdateItemAmount(pIdx, iIdx, parseFloat(e.target.value) || 0)}
                          className="w-12 bg-transparent text-center text-xs font-black text-natural-primary outline-none"
                        />
                        <span className="text-[9px] font-bold text-stone-400 uppercase">{item.unit}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(pIdx, iIdx)}
                        className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {addingToPortion === pIdx ? (
                  <div className="bg-white rounded-2xl p-4 border border-natural-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b border-stone-50 pb-2">
                       <span className="text-[10px] font-black text-natural-primary uppercase tracking-widest">{i18n.cooking.availableIngredients}</span>
                       <button onClick={() => setAddingToPortion(null)} className="text-[10px] text-stone-400 font-bold uppercase">{i18n.common.cancel}</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                      {availableFood.map(food => (
                        <button
                          key={food.id}
                          onClick={() => handleAddItem(pIdx, food.id)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-natural-muted transition-colors border border-transparent hover:border-stone-100"
                        >
                          <span className="text-xs font-bold text-stone-700">{food.name}</span>
                          <span className="text-[9px] text-stone-400 font-bold uppercase">{i18n.cooking.remaining}: {food.amount} {food.unit}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingToPortion(pIdx)}
                    className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 flex items-center justify-center space-x-2 hover:border-natural-primary/30 hover:text-natural-primary transition-all group"
                  >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{i18n.common.add} {i18n.fridge.product.toLowerCase()}</span>
                  </button>
                )}
              </div>

              {/* Portion Totals */}
              <div className="pt-4 border-t border-stone-100 grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{i18n.common.kcalAbbr}</div>
                  <div className="text-sm font-serif font-black text-natural-primary">{portion.totals.kcal}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{i18n.macros.protein}</div>
                  <div className="text-sm font-serif font-black text-natural-primary">{portion.totals.protein}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{i18n.macros.fat}</div>
                  <div className="text-sm font-serif font-black text-natural-primary">{portion.totals.fat}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{i18n.macros.carbs}</div>
                  <div className="text-sm font-serif font-black text-natural-primary">{portion.totals.carbs}</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Validation Warnings */}
        {editedResult.validationReport?.inventoryWarnings && editedResult.validationReport.inventoryWarnings.length > 0 && (
          <section className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-start space-x-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h6 className="text-[10px] font-black text-red-700 uppercase tracking-widest">{i18n.cooking.warnings}</h6>
              {editedResult.validationReport.inventoryWarnings.map((w, i) => (
                <p key={i} className="text-[10px] font-bold text-red-600 italic leading-tight">{w}</p>
              ))}
            </div>
          </section>
        )}

        {/* Remaining Inventory Preview */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.inventoryAfter}</h4>
          <div className="overflow-hidden rounded-[32px] border border-stone-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest italic">{i18n.cooking.product}</th>
                  <th className="px-4 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest italic text-right">{i18n.cooking.spent}</th>
                  <th className="px-4 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest italic text-right">{i18n.cooking.remaining}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-50">
                {editedResult.inventoryAfter.filter(m => m.usedAmount > 0).map(move => (
                  <tr key={move.foodItemId}>
                    <td className="px-4 py-3 text-xs font-bold text-stone-700">{move.foodName}</td>
                    <td className="px-4 py-3 text-xs font-black text-natural-primary text-right">{move.usedAmount} {move.unit}</td>
                    <td className={`px-4 py-3 text-xs font-black text-right ${move.remainingAmount < 0 ? 'text-red-500' : 'text-stone-400'}`}>
                      {move.remainingAmount} {move.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-stone-100 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-[24px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all text-[10px]"
          >
            {i18n.common.cancel}
          </button>
          <button 
            onClick={() => onSave(editedResult)}
            className="flex-[2] py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-natural-primary/10 active:scale-95 transition-all flex items-center justify-center space-x-2 text-[10px]"
          >
            <Save size={16} />
            <span>{i18n.common.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
