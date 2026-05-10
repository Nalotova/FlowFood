/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserProfile, FoodItem, FoodLogEntry } from '../../types';
import { calculateFoodNutrition, getFoodWeightInGrams } from '../../utils/nutrition';
import { Check, ChevronRight, X, Info, Sparkles, Loader2, Trash2, AlertCircle, Edit2, Camera, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { estimateFoodFromText, TextFoodEstimationResult, TextFoodEstimationItem } from '../../services/foodTextEstimationService';
import { estimateFoodFromPhotos, FoodEstimationResult } from '../../services/photoFoodEstimationService';
import { compressImages, CompressedImage } from '../../utils/imageCompression';
import { useAppUI } from '../../contexts/AppUIContext';
import { AppSelect } from '../ui/AppSelect';

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
  const { showToast } = useAppUI();
  const activeProfiles = profiles.filter(p => p.isActive);
  const availableFood = foodItems.filter(f => f.amount > 0);

  const [mode, setMode] = useState<'fridge' | 'manual' | 'text' | 'photo'>(initialData ? 'manual' : 'fridge');
  const [profileId, setProfileId] = useState(activeProfiles[0]?.id || '');
  const [foodId, setFoodId] = useState('');
  const [amount, setAmount] = useState<number>(initialData ? 1 : 0);
  const [subtractFromFridge, setSubtractFromFridge] = useState(!initialData);
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // Manual mode states
  const [manualName, setManualName] = useState(initialData?.foodName || '');
  const [manualKcal, setManualKcal] = useState<number>(initialData?.kcal || 0);
  const [manualProtein, setManualProtein] = useState<number>(initialData?.protein || 0);
  const [manualFat, setManualFat] = useState<number>(initialData?.fat || 0);
  const [manualCarbs, setManualCarbs] = useState<number>(initialData?.carbs || 0);

  // Text mode states
  const [textDescription, setTextDescription] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<TextFoodEstimationResult | null>(null);

  // Photo mode states
  const [photoImages, setPhotoImages] = useState<CompressedImage[]>([]);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<FoodEstimationResult | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoCameraInputRef = useRef<HTMLInputElement>(null);

  const isManualMode = mode !== 'fridge';

  const selectedFood = useMemo(() => foodItems.find(f => f.id === foodId), [foodId, foodItems]);
  const selectedProfile = useMemo(() => profiles.find(p => p.id === profileId), [profileId, profiles]);

  const nutrition = useMemo(() => {
    if (mode === 'manual' && initialData) {
      return {
        kcal: manualKcal,
        protein: manualProtein,
        fat: manualFat,
        carbs: manualCarbs
      };
    }
    if (!selectedFood || !amount || mode !== 'fridge') return null;
    return calculateFoodNutrition(selectedFood, amount);
  }, [selectedFood, amount, mode, manualKcal, manualProtein, manualFat, manualCarbs, initialData]);

  const handleEstimateText = async () => {
    if (!textDescription.trim()) return;
    setIsEstimating(true);
    try {
      const result = await estimateFoodFromText(textDescription);
      setEstimationResult(result);
    } catch (error) {
      console.error(error);
      showToast('Ошибка при разборе текста', 'error');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleUpdateEstimatedItem = (itemId: string, updates: Partial<TextFoodEstimationItem>) => {
    if (!estimationResult) return;
    
    const updatedItems = estimationResult.items.map(item => {
      if (item.id === itemId) {
        const newItem = { ...item, ...updates };
        
        // Recalculate item nutrition based on per 100g and estimated grams
        const grams = newItem.estimatedGrams;
        newItem.kcal = Math.round((grams / 100) * newItem.kcalPer100g);
        newItem.protein = Math.round((grams / 100) * newItem.proteinPer100g * 10) / 10;
        newItem.fat = Math.round((grams / 100) * newItem.fatPer100g * 10) / 10;
        newItem.carbs = Math.round((grams / 100) * newItem.carbsPer100g * 10) / 10;
        
        return newItem;
      }
      return item;
    });

    // Recalculate totals
    const totals = updatedItems.reduce((acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      grams: acc.grams + item.estimatedGrams
    }), { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 });

    setEstimationResult({
      ...estimationResult,
      items: updatedItems,
      totals
    });
  };

  const handleRemoveEstimatedItem = (itemId: string) => {
    if (!estimationResult) return;
    const updatedItems = estimationResult.items.filter(i => i.id !== itemId);
    
    const totals = updatedItems.reduce((acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      grams: acc.grams + item.estimatedGrams
    }), { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 });

    setEstimationResult({
      ...estimationResult,
      items: updatedItems,
      totals
    });
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (photoImages.length + files.length > 3) {
      setPhotoError('Максимум 3 фото');
      return;
    }

    const invalidFiles = files.filter(f => !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type));
    if (invalidFiles.length > 0) {
      setPhotoError('Только JPEG, PNG или WEBP');
      return;
    }

    const largeFiles = files.filter(f => f.size > 15 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setPhotoError('Максимальный размер файла 15 МБ');
      return;
    }

    setPhotoError(null);
    setIsPhotoProcessing(true);
    try {
      const compressed = await compressImages(files);
      setPhotoImages(prev => [...prev, ...compressed]);
    } catch (err) {
      console.error(err);
      setPhotoError('Ошибка при сжатии фото');
    } finally {
      setIsPhotoProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoImages(prev => prev.filter((_, i) => i !== index));
    if (photoImages.length <= 1) {
      setPhotoResult(null);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (photoImages.length === 0) {
      setPhotoError('Добавьте хотя бы одно фото');
      return;
    }

    setIsPhotoProcessing(true);
    setPhotoError(null);
    try {
      const result = await estimateFoodFromPhotos({ 
        images: photoImages.map(img => img.dataUrl) 
      });
      
      if (result.status === 'failed') {
        setPhotoError(result.warnings[0] || 'Не удалось распознать еду');
      } else {
        setPhotoResult(result);
        setManualName(result.foodName);
        setManualKcal(result.kcal);
        setManualProtein(result.protein);
        setManualFat(result.fat);
        setManualCarbs(result.carbs);
        
        const warningsText = result.warnings.length > 0 ? `\n\nПредупреждения:\n${result.warnings.join('\n')}` : '';
        setNotes(prev => {
          const baseNotes = prev.trim();
          return `${baseNotes}${baseNotes ? '\n\n' : ''}${result.notes}${warningsText}`.trim();
        });
      }
    } catch (err) {
      console.error(err);
      setPhotoError('Ошибка при разборе фото');
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return showToast('Выберите участника', 'warning');
    if (!selectedProfile) return;

    if (mode === 'text') {
      if (!estimationResult || estimationResult.items.length === 0) return showToast('Сначала рассчитайте состав еды', 'warning');
      
      const ingredientsList = estimationResult.items.map(i => 
        `- ${i.name}: ${i.amount} ${i.unit}, ~${i.estimatedGrams}г, ${i.kcal} ккал (Б:${i.protein} Ж:${i.fat} У:${i.carbs})`
      ).join('\n');
      
      const fullNotes = `Исходный текст: ${textDescription}\n\nСостав:\n${ingredientsList}\n\n${notes}`.trim();

      await onSave({
        profileId,
        profileName: selectedProfile.name,
        date: new Date().toISOString().split('T')[0],
        type: 'manual_entry',
        foodName: estimationResult.mealName || estimationResult.items[0].name,
        amount: 1,
        unit: 'порция',
        grams: estimationResult.totals.grams,
        kcal: estimationResult.totals.kcal,
        protein: estimationResult.totals.protein,
        fat: estimationResult.totals.fat,
        carbs: estimationResult.totals.carbs,
        subtractFromFridge: false,
        notes: fullNotes,
      });
      return;
    }

    if (mode === 'photo') {
      if (!photoResult) return showToast('Сначала рассчитайте состав еды по фото', 'warning');
      if (!manualName) return showToast('Укажите название еды', 'warning');

      await onSave({
        profileId,
        profileName: selectedProfile.name,
        date: new Date().toISOString().split('T')[0],
        type: 'manual_entry',
        foodName: manualName,
        amount: 1,
        unit: 'порция',
        grams: photoResult.weightGrams || 0,
        kcal: manualKcal,
        protein: manualProtein,
        fat: manualFat,
        carbs: manualCarbs,
        subtractFromFridge: false,
        notes: notes + ' (Оценка по фото ИИ)',
      });
      return;
    }

    if (mode === 'manual') {
      if (!manualName) return showToast('Укажите название еды', 'warning');
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
      return;
    }

    if (mode === 'fridge') {
      if (!foodId) return showToast('Выберите продукт', 'warning');
      if (!amount || amount <= 0) return showToast('Укажите количество', 'warning');
      if (selectedFood && amount > selectedFood.amount) {
        return showToast(`${i18n.validation.deficitWarning}. В холодильнике всего ${selectedFood.amount} ${selectedFood.unit}`, 'warning');
      }

      if (selectedFood) {
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onCancel} />
      
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <h3 className="text-xl font-serif font-black text-natural-primary">{i18n.foodLog.quickSnack}</h3>
          <button type="button" onClick={onCancel} className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {/* Mode Selector Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-2xl">
            {(['fridge', 'manual', 'text', 'photo'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                  mode === m ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
                }`}
              >
                {m === 'fridge' ? 'Холодильник' : m === 'manual' ? 'Вручную' : m === 'text' ? 'Текст' : 'По фото'}
              </button>
            ))}
          </div>

          {/* Profile Select (Common) */}
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

          {mode === 'photo' && (
             <div className="space-y-6">
               <div className="space-y-2 text-center">
                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Добавьте фото еды</label>
                 <p className="text-[9px] text-stone-400">Можно загрузить до 3 фото: общий вид, крупный план, упаковка с составом</p>
                 
                 <div className="flex flex-wrap gap-3 justify-center pt-2">
                   {photoImages.map((img, idx) => (
                     <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
                       <img src={img.dataUrl} className="w-full h-full object-cover" alt={`Food ${idx}`} />
                       <button 
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-lg text-red-500 hover:bg-white"
                       >
                         <Trash2 size={12} />
                       </button>
                     </div>
                   ))}
                   
                   {photoImages.length < 3 && (
                     <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => photoCameraInputRef.current?.click()}
                         className="w-20 h-20 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-natural-primary hover:text-natural-primary transition-all"
                       >
                         <Camera size={20} />
                         <span className="text-[8px] font-bold uppercase mt-1">Камера</span>
                       </button>
                       <button
                         type="button"
                         onClick={() => photoFileInputRef.current?.click()}
                         className="w-20 h-20 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-natural-primary hover:text-natural-primary transition-all"
                       >
                         <ImageIcon size={20} />
                         <span className="text-[8px] font-bold uppercase mt-1">Галерея</span>
                       </button>
                     </div>
                   )}
                 </div>

                 <input 
                   ref={photoCameraInputRef}
                   type="file" 
                   accept="image/*" 
                   capture="environment" 
                   onChange={handlePhotoFileChange} 
                   className="hidden" 
                 />
                 <input 
                   ref={photoFileInputRef}
                   type="file" 
                   accept="image/*" 
                   multiple 
                   onChange={handlePhotoFileChange} 
                   className="hidden" 
                 />

                 {photoError && (
                   <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                     <AlertCircle size={14} className="shrink-0" />
                     <p className="text-[10px] font-bold">{photoError}</p>
                   </div>
                 )}

                 <button
                   type="button"
                   onClick={handleAnalyzePhoto}
                   disabled={isPhotoProcessing || photoImages.length === 0}
                   className="w-full mt-4 bg-natural-primary text-white py-4 rounded-[20px] text-xs font-black uppercase tracking-widest shadow-lg shadow-natural-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isPhotoProcessing ? (
                     <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>ИИ оценивает...</span>
                     </>
                   ) : (
                     <>
                        <Sparkles size={18} />
                        <span>Рассчитать по фото</span>
                     </>
                   )}
                 </button>
               </div>

               {photoResult && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-natural-primary uppercase tracking-widest">Результат оценки ИИ</h4>
                        {photoResult.confidenceScore >= 0.75 ? (
                          <span className="text-[8px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full px-2">Уверенность высокая</span>
                        ) : photoResult.confidenceScore >= 0.45 ? (
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full px-2">Уверенность средняя</span>
                        ) : (
                          <span className="text-[8px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full px-2">Проверьте данные</span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2">Название еды</label>
                          <input 
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="w-full bg-white border border-stone-100 rounded-xl p-3 text-xs font-black text-stone-800"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2">Ккал</label>
                             <input 
                               type="number"
                               value={manualKcal}
                               onChange={(e) => setManualKcal(parseFloat(e.target.value) || 0)}
                               className="w-full bg-white border border-stone-100 rounded-xl p-3 text-xs font-black text-stone-800"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2">Белки</label>
                             <input 
                               type="number"
                               value={manualProtein}
                               onChange={(e) => setManualProtein(parseFloat(e.target.value) || 0)}
                               className="w-full bg-white border border-stone-100 rounded-xl p-3 text-xs font-black text-stone-800"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2">Жиры</label>
                             <input 
                               type="number"
                               value={manualFat}
                               onChange={(e) => setManualFat(parseFloat(e.target.value) || 0)}
                               className="w-full bg-white border border-stone-100 rounded-xl p-3 text-xs font-black text-stone-800"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2">Углеводы</label>
                             <input 
                               type="number"
                               value={manualCarbs}
                               onChange={(e) => setManualCarbs(parseFloat(e.target.value) || 0)}
                               className="w-full bg-white border border-stone-100 rounded-xl p-3 text-xs font-black text-stone-800"
                             />
                           </div>
                        </div>

                        {photoResult.weightGrams && (
                          <p className="text-[9px] text-stone-400 font-bold italic px-2">Оценка веса: {photoResult.weightGrams} г</p>
                        )}
                      </div>

                      {photoResult.warnings.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-2">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            {photoResult.warnings.map((w, i) => (
                              <p key={i} className="text-[9px] text-amber-700 font-bold leading-tight">{w}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-stone-400 text-center uppercase tracking-widest font-black">Проверьте результат перед сохранением</p>
                 </div>
               )}
             </div>
          )}

          {mode === 'text' && (
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Описание еды</label>
                 <div className="relative">
                   <textarea
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                    placeholder="Например: 2 яйца жареные на 5 г масла, овсянка сухая 40 г, банан 100 г"
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-natural-primary/10"
                   />
                   <button
                    type="button"
                    onClick={handleEstimateText}
                    disabled={isEstimating || !textDescription.trim()}
                    className="absolute bottom-3 right-3 bg-natural-primary text-white p-3 rounded-xl disabled:opacity-50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-natural-primary/20"
                   >
                     {isEstimating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                   </button>
                 </div>
               </div>

               {estimationResult && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black text-natural-primary uppercase tracking-widest">Результат оценки</h4>
                       <div className="text-[10px] font-bold text-stone-400">{estimationResult.totals.kcal} ккал</div>
                    </div>

                    <div className="space-y-3">
                      {estimationResult.items.map(item => (
                        <div key={item.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-serif font-black text-stone-700">{item.name}</p>
                              <p className="text-[9px] text-stone-400 font-bold uppercase">{item.amount} {item.unit} ≈ {item.estimatedGrams}г</p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveEstimatedItem(item.id)}
                              className="text-stone-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                               <label className="text-[7px] font-black text-stone-400 uppercase px-1">Граммы</label>
                               <input 
                                 type="number"
                                 value={item.estimatedGrams}
                                 onChange={(e) => handleUpdateEstimatedItem(item.id, { estimatedGrams: parseFloat(e.target.value) || 0 })}
                                 className="w-full bg-white border border-stone-100 rounded-lg p-2 text-xs font-black text-natural-primary"
                               />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[7px] font-black text-stone-400 uppercase px-1">Ккал/100г</label>
                               <input 
                                 type="number"
                                 value={item.kcalPer100g}
                                 onChange={(e) => handleUpdateEstimatedItem(item.id, { kcalPer100g: parseFloat(e.target.value) || 0 })}
                                 className="w-full bg-white border border-stone-100 rounded-lg p-2 text-xs font-black text-natural-primary"
                               />
                             </div>
                          </div>

                          <div className="flex items-center justify-between text-[8px] font-bold text-stone-400 uppercase border-t border-stone-100 pt-2">
                             <span>Б: {item.protein}</span>
                             <span>Ж: {item.fat}</span>
                             <span>У: {item.carbs}</span>
                             <span className="text-stone-300 italic">{item.kcal} ккал</span>
                          </div>

                          {item.warnings.length > 0 && (
                            <div className="flex items-start gap-1 text-[8px] text-amber-600 font-bold leading-tight bg-amber-50 p-2 rounded-lg">
                              <AlertCircle size={10} className="shrink-0 mt-0.5" />
                              <p>{item.warnings[0]}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-natural-primary/5 rounded-[32px] p-6 border border-natural-primary/10 space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-[8px] font-black text-stone-400 uppercase">Ккал</div>
                          <div className="text-sm font-serif font-black text-natural-primary">{estimationResult.totals.kcal}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-black text-stone-400 uppercase">Белки</div>
                          <div className="text-sm font-serif font-black text-natural-primary">{estimationResult.totals.protein}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-black text-stone-400 uppercase">Жиры</div>
                          <div className="text-sm font-serif font-black text-natural-primary">{estimationResult.totals.fat}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-black text-stone-400 uppercase">Углеводы</div>
                          <div className="text-sm font-serif font-black text-natural-primary">{estimationResult.totals.carbs}</div>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
             </div>
          )}

          {mode === 'fridge' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.foodLog.whatAte}</label>
                <AppSelect
                  value={foodId || ''}
                  onChange={(e) => setFoodId(e.target.value)}
                  options={[
                    { value: '', label: 'Выберите продукт из холодильника...' },
                    ...availableFood.map(f => ({ value: f.id, label: `${f.name} (${f.amount} ${f.unit})` }))
                  ]}
                  className="bg-stone-50"
                />
              </div>

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
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Комментарий</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные детали..."
              rows={2}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
            />
          </div>
        </div>

        <div className="p-6 bg-stone-50 safe-bottom border-t border-stone-100">
          <button
            type="submit"
            disabled={(mode === 'text' && !estimationResult) || (mode === 'photo' && !photoResult)}
            className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-natural-primary/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Check size={18} />
            <span>{i18n.common.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

