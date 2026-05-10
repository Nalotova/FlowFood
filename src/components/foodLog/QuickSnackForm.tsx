/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { UserProfile, FoodItem, FoodLogEntry } from '../../types';
import { calculateFoodNutrition, getFoodWeightInGrams } from '../../utils/nutrition';
import { Check, ChevronRight, X, Info } from 'lucide-react';

import { i18n } from '../../i18n/ru';

interface QuickSnackFormProps {
  profiles: UserProfile[];
  foodItems: FoodItem[];
  onSave: (entry: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    foodName: string;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    notes?: string;
  };
}

export const QuickSnackForm: React.FC<QuickSnackFormProps> = ({ 
  profiles, 
  foodItems, 
  onSave, 
  onCancel,
  initialData
}) => {
  const activeProfiles = profiles.filter(p => p.isActive);
  const availableFood = foodItems.filter(f => f.amount > 0);

  const [mode, setMode] = useState<'fridge' | 'manual' | 'text' | 'photo'>(initialData ? 'manual' : 'fridge');
  const [profileId, setProfileId] = useState(activeProfiles[0]?.id || '');
  const [foodId, setFoodId] = useState('');
  const [amount, setAmount] = useState<number>(initialData ? 1 : 0);
  const [subtractFromFridge, setSubtractFromFridge] = useState(!initialData);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [manualName, setManualName] = useState(initialData?.foodName || '');
  const [manualKcal, setManualKcal] = useState<number>(initialData?.kcal || 0);
  const [manualProtein, setManualProtein] = useState<number>(initialData?.protein || 0);
  const [manualFat, setManualFat] = useState<number>(initialData?.fat || 0);
  const [manualCarbs, setManualCarbs] = useState<number>(initialData?.carbs || 0);

  const isManualMode = mode !== 'fridge';

  const selectedFood = useMemo(() => foodItems.find(f => f.id === foodId), [foodId, foodItems]);
  const selectedProfile = useMemo(() => profiles.find(p => p.id === profileId), [profileId, profiles]);

  const nutrition = useMemo(() => {
    if (isManualMode && initialData) {
      return {
        kcal: manualKcal,
        protein: manualProtein,
        fat: manualFat,
        carbs: manualCarbs
      };
    }
    if (!selectedFood || !amount) return null;
    return calculateFoodNutrition(selectedFood, amount);
  }, [selectedFood, amount, isManualMode, manualKcal, manualProtein, manualFat, manualCarbs, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return alert('Выберите участника');
    if (!isManualMode && !foodId) return alert('Выберите продукт');
    if (!isManualMode && (!amount || amount <= 0)) return alert('Укажите количество');
    if (isManualMode && !manualName) return alert('Укажите название еды');
    if (!selectedProfile) return;

    if (!isManualMode && selectedFood && amount > selectedFood.amount) {
      return alert(`${i18n.validation.deficitWarning}. В холодильнике всего ${selectedFood.amount} ${selectedFood.unit}`);
    }

    if (isManualMode) {
      await onSave({
        profileId,
        profileName: selectedProfile.name,
        date: new Date().toISOString().split('T')[0],
        type: 'manual_entry',
        foodName: manualName,
        amount: 1,
        unit: 'piece',
        grams: 0,
        kcal: manualKcal,
        protein: manualProtein,
        fat: manualFat,
        carbs: manualCarbs,
        subtractFromFridge: false,
        notes: notes + (initialData ? ` (Оценка ИИ)` : ''),
      });
    } else if (selectedFood) {
      const weight = getFoodWeightInGrams(selectedFood, amount);
      const nut = calculateFoodNutrition(selectedFood, amount);

      await onSave({
        profileId,
        profileName: selectedProfile.name,
        date: new Date().toISOString().split('T')[0],
        type: 'unplanned_snack',
        foodItemId: foodId,
        foodName: selectedFood.name,
        amount,
        unit: selectedFood.unit,
        grams: weight,
        ...nut,
        subtractFromFridge,
        notes,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onCancel} />
      
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-lg max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-xl font-serif font-black text-natural-primary">{i18n.foodLog.quickSnack}</h3>
          <button type="button" onClick={onCancel} className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* Mode Selector Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('fridge')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                mode === 'fridge' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
              }`}
            >
              Холодильник
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                mode === 'manual' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
              }`}
            >
              Вручную
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                mode === 'text' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
              }`}
            >
              Текст (скоро)
            </button>
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                mode === 'photo' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
              }`}
            >
              По фото (скоро)
            </button>
          </div>

          {mode === 'photo' && (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-stone-50 rounded-[32px] border border-dashed border-stone-200">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-300">
                 <X size={24} />
               </div>
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                 Будет добавлено позже
               </p>
               <p className="text-[9px] text-stone-300 px-8">Используйте кнопку камеры в Дневнике для анализа фото</p>
             </div>
          )}

          {mode === 'text' && (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-stone-50 rounded-[32px] border border-dashed border-stone-200">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-300">
                 <X size={24} />
               </div>
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                 Будет добавлено позже
               </p>
               <p className="text-[9px] text-stone-300 px-8">Умное описание текстом находится в разработке</p>
             </div>
          )}

          {(mode === 'fridge' || mode === 'manual') && (
            <>
              {/* Profile Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.foodLog.whoAte}</label>
                <div className="flex flex-wrap gap-2">
                  {activeProfiles.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfileId(p.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        profileId === p.id 
                          ? 'bg-stone-800 text-white border-stone-800' 
                          : 'bg-white text-stone-600 border-stone-100'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Select or Manual Info */}
              {mode === 'fridge' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.foodLog.whatAte}</label>
                    <select
                      value={foodId || ''}
                      onChange={(e) => setFoodId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none appearance-none"
                    >
                      <option value="">Выберите продукт из холодильника...</option>
                      {availableFood.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.amount} {f.unit})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Название еды</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Что съедено?"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Ккал</label>
                      <input
                        type="number"
                        value={manualKcal || ''}
                        onChange={(e) => setManualKcal(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Белки</label>
                      <input
                        type="number"
                        value={manualProtein || ''}
                        onChange={(e) => setManualProtein(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Жиры</label>
                      <input
                        type="number"
                        value={manualFat || ''}
                        onChange={(e) => setManualFat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Углеводы</label>
                      <input
                        type="number"
                        value={manualCarbs || ''}
                        onChange={(e) => setManualCarbs(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {initialData && mode === 'manual' && (
            <div className="bg-natural-primary/5 p-6 rounded-3xl border border-natural-primary/10 space-y-4">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-natural-primary" />
                <span className="text-[10px] font-black text-natural-primary uppercase tracking-widest">Результат оценки ИИ</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Определено как</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm font-bold text-stone-800 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1 text-center">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Ккал</span>
                    <input
                      type="number"
                      value={manualKcal}
                      onChange={(e) => setManualKcal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-100 rounded-lg p-2 text-[10px] font-black text-center outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Б</span>
                    <input
                      type="number"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-100 rounded-lg p-2 text-[10px] font-black text-center outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Ж</span>
                    <input
                      type="number"
                      value={manualFat}
                      onChange={(e) => setManualFat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-100 rounded-lg p-2 text-[10px] font-black text-center outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">У</span>
                    <input
                      type="number"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-100 rounded-lg p-2 text-[10px] font-black text-center outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedFood && (
            <div className="bg-natural-accent/10 p-5 rounded-3xl border border-natural-accent/20 space-y-4 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{i18n.foodLog.amount} ({selectedFood.unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm font-black text-natural-primary outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <div className="text-[10px] font-bold text-stone-400 italic">
                    Остаток: {selectedFood.amount} {selectedFood.unit}
                  </div>
                  <div className="text-[10px] font-bold text-stone-400 italic">
                    {selectedFood.kcalPer100g} {i18n.common.kcalAbbr} / 100г
                  </div>
                </div>
              </div>

              {nutrition && (
                <div className="flex items-center justify-between pt-2 border-t border-natural-accent/10">
                  <div className="text-sm font-black text-natural-primary">
                    {nutrition.kcal} {i18n.common.kcalAbbr}
                  </div>
                  <div className="flex space-x-3 text-[9px] font-bold text-stone-500 uppercase">
                    <span>{i18n.common.proteinsAbbr}: {nutrition.protein}</span>
                    <span>{i18n.common.fatsAbbr}: {nutrition.fat}</span>
                    <span>{i18n.common.carbsAbbr}: {nutrition.carbs}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={2}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
            />
          </div>
        </div>

        <div className="p-6 bg-stone-50 safe-bottom">
          <button
            type="submit"
            className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <Check size={18} />
            <span>{i18n.common.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
