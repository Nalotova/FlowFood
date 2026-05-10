/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FoodItem, FoodUnit, FoodCategory, FoodState, FoodSource } from '../../types/food';
import { ChevronLeft, Save, AlertCircle, Sparkles } from 'lucide-react';
import { RecognizedFoodDraft } from '../../types/photoRecognition';
import { useApp } from '../../contexts/AppContext';

import { i18n } from '../../i18n/ru';
import { normalizeParsedFoodDraft, normalizeRecognizedFoodDraft } from '../../utils/normalizeFoodDraft';

interface FoodItemFormProps {
  initialData?: FoodItem | Partial<RecognizedFoodDraft>;
  onSave: (item: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export const FoodItemForm: React.FC<FoodItemFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel 
}) => {
  const { setNavbarHidden } = useApp();
  const isDraft = (initialData as any)?.source === 'photo_ocr' || (initialData as any)?.source === 'ai_text' || (initialData as any)?.source === 'ai_text_photo';
  
  useEffect(() => {
    setNavbarHidden(true);
    return () => setNavbarHidden(false);
  }, [setNavbarHidden]);

  const [formData, setFormData] = useState<Partial<FoodItem>>(() => {
    // DIAGNOSTICS: log incoming data
    console.log('[FoodItemForm] initialData:', initialData);

    let finalData: Partial<FoodItem>;
    if (!initialData) {
      finalData = {
        name: '',
        brand: '',
        amount: 1,
        unit: 'g',
        kcalPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
        categories: ['other'],
        state: 'ready',
        source: 'manual',
        notes: '',
      };
    } else if ((initialData as any).source === 'ai_text' || (initialData as any).source === 'ai_text_photo') {
      finalData = normalizeParsedFoodDraft(initialData);
    } else if ((initialData as any).source === 'photo_ocr') {
      finalData = normalizeRecognizedFoodDraft(initialData);
    } else {
      finalData = {
        ...initialData,
        name: initialData.name ?? "",
        brand: (initialData as any).brand ?? "",
        amount: (initialData as any).amount ?? 0,
        unit: (initialData as any).unit ?? "g",
        categories: (initialData as any).categories ?? ["other"],
        state: (initialData as any).state ?? "ready",
        source: (initialData as any).source ?? "manual",
      } as Partial<FoodItem>;
    }

    // DIAGNOSTICS: log normalized data
    console.log('[FoodItemForm] initialized formData:', finalData);
    console.log('[FoodItemForm] unit select value:', finalData.unit);
    if (finalData.unit === null) console.warn('[FoodItemForm] unit is NULL!');
    if (finalData.state === null) console.warn('[FoodItemForm] state is NULL!');

    return finalData;
  });

  const categories: FoodCategory[] = [
    "protein", "carb", "fat", "vegetable", "fruit", "dairy", "fish", "meat", "egg", "grain", "ready_meal", "other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert(i18n.validation.foodNameRequired);
    if (formData.amount === undefined || formData.amount < 0) return alert(i18n.validation.amountRequired);
    if ((formData.unit === 'piece' || formData.unit === 'package') && (!formData.gramsPerUnit || formData.gramsPerUnit <= 0)) {
       return alert(i18n.validation.unitWeightRequired);
    }

    if (formData.kcalPer100g === undefined || formData.proteinPer100g === undefined || formData.fatPer100g === undefined || formData.carbsPer100g === undefined) {
      return alert(i18n.fridge.checkData);
    }

    if (isDraft && (formData.confidenceScore || 0) < 0.7) {
      if (!confirm(i18n.fridge.lowConfidence)) return;
    }

    onSave(formData as Omit<FoodItem, "id" | "createdAt" | "updatedAt">);
  };

  const toggleCategory = (cat: FoodCategory) => {
    setFormData(prev => {
      const cats = prev.categories || [];
      if (cats.includes(cat)) {
        const filtered = cats.filter(c => c !== cat);
        return { ...prev, categories: filtered.length === 0 ? ['other'] : filtered };
      } else {
        return { ...prev, categories: [...cats, cat] };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] overflow-y-auto safe-top">
      <form onSubmit={handleSubmit} className="min-h-screen flex flex-col pt-0">
        <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 px-6 border-b border-stone-100">
          <button type="button" onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-serif font-bold text-xl text-natural-primary">
            {initialData ? i18n.common.edit : i18n.fridge.addProduct}
          </h2>
          <button type="submit" className="p-2 text-natural-primary hover:scale-110 transition-transform">
            <Save size={24} />
          </button>
        </div>

        <div className="flex-1 px-6 pt-6 pb-44 space-y-6">
          {/* Draft Warnings */}
          {isDraft && (
            <div className="space-y-3">
               <div className="bg-natural-primary/5 border border-natural-primary/10 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="text-natural-primary shrink-0" size={18} />
                <div>
                  <p className="text-xs font-black text-natural-primary uppercase tracking-tight">Продукт распознан ИИ ({(formData.confidenceScore || 0) * 100}%)</p>
                  <p className="text-[10px] font-bold text-stone-500 mt-1">{i18n.fridge.checkData}</p>
                </div>
              </div>
              
              {(initialData as any).warnings?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <ul className="text-[10px] font-bold text-amber-700 list-disc list-inside space-y-1">
                    {(initialData as any).warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Basic Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Основное</h4>
            <div className="bg-white rounded-[32px] border border-stone-100 p-5 space-y-4 shadow-sm">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Название</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  placeholder="Что добавим?"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Бренд (опционально)</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  placeholder="Например: Простоквашино"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Количество</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Ед. изм.</label>
                  <select
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as FoodUnit })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none appearance-none"
                  >
                    {Object.entries(i18n.fridge.units).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(formData.unit === 'piece' || formData.unit === 'package') && (
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                    Вес 1 {formData.unit === 'piece' ? 'штуки' : 'упаковки'} (г)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.gramsPerUnit || ''}
                    onChange={(e) => setFormData({ ...formData, gramsPerUnit: parseInt(e.target.value) || undefined })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                    placeholder="Напр. 50"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Nutrition Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Пищевая ценность (на 100г)</h4>
            <div className="bg-white rounded-[32px] border border-stone-100 p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Калории (ккал)</label>
                <input
                  type="number"
                  value={formData.kcalPer100g || ''}
                  onChange={(e) => setFormData({ ...formData, kcalPer100g: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1 text-center">Белки</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.proteinPer100g || ''}
                    onChange={(e) => setFormData({ ...formData, proteinPer100g: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-3 text-[10px] font-bold text-center focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1 text-center">Жиры</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fatPer100g || ''}
                    onChange={(e) => setFormData({ ...formData, fatPer100g: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-3 text-[10px] font-bold text-center focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1 text-center">Угл.</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.carbsPer100g || ''}
                    onChange={(e) => setFormData({ ...formData, carbsPer100g: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-3 text-[10px] font-bold text-center focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Additional Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Дополнительно</h4>
            <div className="bg-white rounded-[32px] border border-stone-100 p-5 space-y-4 shadow-sm">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Срок годности</label>
                <input
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Заметки</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-natural-primary/20 transition-all outline-none min-h-[100px] resize-none"
                  placeholder="Что-то важное о продукте..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-stone-100 safe-bottom z-20">
          <div className="max-w-md mx-auto">
            <button
              type="submit"
              className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-natural-primary/10 active:scale-95 transition-all"
            >
              {initialData ? i18n.common.save : i18n.fridge.addProduct}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
