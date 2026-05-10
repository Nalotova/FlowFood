/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Gender, MealDistribution, DataSource } from '../../types/profile';
import { ChevronLeft, Save, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAppUI } from '../../contexts/AppUIContext';
import { AppSelect } from '../ui/AppSelect';

import { i18n } from '../../i18n/ru';

interface ProfileFormProps {
  initialData?: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel 
}) => {
  const { setNavbarHidden } = useApp();
  const { showToast } = useAppUI();

  useEffect(() => {
    setNavbarHidden(true);
    return () => setNavbarHidden(false);
  }, [setNavbarHidden]);

  const [formData, setFormData] = useState<Partial<UserProfile>>(() => {
    // DIAGNOSTICS
    console.log('[ProfileForm] initialData:', initialData);

    const data = initialData || {
      id: crypto.randomUUID(),
      name: '',
      isActive: true,
      role: 'adult',
      gender: 'not_specified',
      dataSource: 'Local Storage',
      portionMultiplier: 1.0,
      proteinSettings: { mode: 'not_tracked' },
      mealDistribution: { breakfast: 0, lunch: 0, snack: 0, dinner: 0 },
      preferences: [],
      likedFoods: [],
      dislikedFoods: [],
      forbiddenFoods: [],
      allergies: [],
      usuallyEatsTogether: true,
      allowSameDishDifferentPortion: true,
      allowSeparateDish: false,
    };

    return {
      ...data,
      name: data.name ?? '',
      gender: data.gender ?? 'not_specified',
      role: data.role ?? 'adult',
      dataSource: data.dataSource ?? 'Local Storage',
      proteinSettings: {
        ...(data.proteinSettings || { mode: 'not_tracked' }),
        mode: data.proteinSettings?.mode ?? 'not_tracked'
      }
    };
  });

  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    const sum = (formData.mealDistribution?.breakfast || 0) + 
                (formData.mealDistribution?.lunch || 0) + 
                (formData.mealDistribution?.snack || 0) + 
                (formData.mealDistribution?.dinner || 0);
    
    if (formData.dailyKcal && Math.abs(sum - formData.dailyKcal) > 150) {
      setValidationWarning(`${i18n.validation.mealDistWarning} (${sum} vs ${formData.dailyKcal})`);
    } else {
      setValidationWarning(null);
    }
  }, [formData.dailyKcal, formData.mealDistribution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return showToast(i18n.validation.nameRequired, 'warning');
    if (formData.dailyKcal && formData.dailyKcal <= 0) return showToast(i18n.validation.kcalRequired, 'warning');
    if (formData.portionMultiplier && formData.portionMultiplier <= 0) return showToast(i18n.validation.multiplierRequired, 'warning');

    // Protein validation
    if (formData.proteinSettings?.mode === 'manual') {
      if (!formData.proteinSettings.proteinTargetGrams || formData.proteinSettings.proteinTargetGrams <= 0) {
        return showToast(i18n.validation.proteinManualRequired, 'warning');
      }
    } else if (formData.proteinSettings?.mode === 'auto') {
      if (!formData.proteinSettings.bodyWeightKg || formData.proteinSettings.bodyWeightKg <= 0) {
        return showToast(i18n.validation.weightRequired, 'warning');
      }
      if (!formData.proteinSettings.proteinPerKg || formData.proteinSettings.proteinPerKg <= 0) {
        return showToast(i18n.validation.proteinPerKgRequired, 'warning');
      }
    }

    onSave(formData as UserProfile);
  };

  const handleTextAreaChange = (name: keyof UserProfile, value: string) => {
    const lines = value.split('\n').map(l => l.trim()).filter(l => l !== '');
    setFormData(prev => ({ ...prev, [name]: lines }));
  };

  const handleDistChange = (meal: keyof MealDistribution, value: string) => {
    const num = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      mealDistribution: { ...prev.mealDistribution, [meal]: num }
    }));
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] overflow-y-auto safe-top">
      <form onSubmit={handleSubmit} className="min-h-screen flex flex-col pt-0">
        <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 px-6 border-b border-stone-100">
          <button type="button" onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-serif font-bold text-xl text-natural-primary">
            {initialData ? i18n.common.edit : i18n.profiles.addProfile}
          </h2>
          <button type="submit" className="p-2 text-natural-primary hover:scale-110 transition-transform">
            <Save size={24} />
          </button>
        </div>

        <div className="flex-1 px-6 pt-6 pb-44 space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Основное</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2 italic">Имя *</label>
                <input
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  placeholder="Как вас называть?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 px-2 italic">Возраст</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                    className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 px-2 italic">Пол</label>
                  <AppSelect
                    value={formData.gender || 'not_specified'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                    options={Object.entries(i18n.profiles.genders).map(([key, val]) => ({ value: key, label: val }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 px-2 italic">Источник данных</label>
                  <AppSelect
                    value={formData.dataSource || 'Local Storage'}
                    onChange={e => setFormData({ ...formData, dataSource: e.target.value as DataSource })}
                    options={[
                      { value: 'Firebase', label: 'Firebase' },
                      { value: 'Local Storage', label: 'Local Storage' },
                      { value: 'API', label: 'API' }
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 px-2 italic">Роль</label>
                  <AppSelect
                    value={formData.role || 'adult'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    options={Object.entries(i18n.profiles.roles).map(([key, val]) => ({ value: key, label: val }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Protein Settings */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Белок</h4>
            <div className="bg-stone-50 p-5 rounded-[32px] border border-stone-100 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2 italic">Режим отслеживания белка</label>
                <AppSelect
                  value={formData.proteinSettings?.mode || 'not_tracked'}
                  onChange={e => setFormData({
                    ...formData,
                    proteinSettings: { ...formData.proteinSettings, mode: e.target.value as any }
                  })}
                  options={[
                    { value: 'not_tracked', label: 'Не отслеживать' },
                    { value: 'manual', label: 'Задать вручную' },
                    { value: 'auto', label: 'Рассчитать по весу' }
                  ]}
                  className="bg-white"
                />
                <p className="text-[10px] text-stone-400 px-2 leading-tight">
                  {formData.proteinSettings?.mode === 'not_tracked' 
                    ? 'Для детей/гостей можно выбрать "Не отслеживать".'
                    : 'Для взрослых с фитнес-целями можно задать норму белка вручную или рассчитать по весу.'}
                </p>
              </div>

              {formData.proteinSettings?.mode === 'manual' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-bold text-stone-600 px-2 italic">Норма белка, г/день *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.proteinSettings?.proteinTargetGrams || ''}
                    onChange={e => setFormData({
                      ...formData,
                      proteinSettings: { ...formData.proteinSettings, proteinTargetGrams: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                    placeholder="Например, 120"
                  />
                </div>
              )}

              {formData.proteinSettings?.mode === 'auto' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-600 px-2 italic">Вес, кг *</label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        required
                        value={formData.proteinSettings?.bodyWeightKg || ''}
                        onChange={e => setFormData({
                          ...formData,
                          proteinSettings: { ...formData.proteinSettings, bodyWeightKg: parseFloat(e.target.value) || undefined }
                        })}
                        className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-600 px-2 italic">г на кг веса *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={formData.proteinSettings?.proteinPerKg || ''}
                        onChange={e => setFormData({
                          ...formData,
                          proteinSettings: { ...formData.proteinSettings, proteinPerKg: parseFloat(e.target.value) || undefined }
                        })}
                        className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                      />
                    </div>
                  </div>
                  {formData.proteinSettings?.bodyWeightKg && formData.proteinSettings?.proteinPerKg && (
                    <div className="px-4 py-2 bg-natural-primary/5 rounded-xl border border-natural-primary/10">
                      <span className="text-[10px] font-bold text-natural-primary uppercase tracking-wider">Итого: </span>
                      <span className="text-sm font-black text-natural-primary">
                        {Math.round(formData.proteinSettings.bodyWeightKg * formData.proteinSettings.proteinPerKg)} г белка/день
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Nutrition Targets */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Цели БЖУ</h4>
            <div className="bg-stone-50 p-5 rounded-[32px] border border-stone-100 space-y-6">
              
              {/* Protein */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-stone-600 px-2 italic">Белок</label>
                <AppSelect
                  value={formData.nutritionTargets?.proteinMode || (formData.proteinSettings?.mode === 'auto' ? 'per_kg' : formData.proteinSettings?.mode === 'manual' ? 'manual' : 'not_tracked')}
                  onChange={e => {
                    const mode = e.target.value as any;
                    setFormData({
                      ...formData,
                      nutritionTargets: { 
                        ...(formData.nutritionTargets || {}), 
                        proteinMode: mode,
                        proteinGrams: mode === 'manual' ? (formData.nutritionTargets?.proteinGrams || formData.proteinSettings?.proteinTargetGrams) : formData.nutritionTargets?.proteinGrams,
                        bodyWeightKg: (formData.nutritionTargets?.bodyWeightKg || formData.proteinSettings?.bodyWeightKg),
                        proteinPerKg: (formData.nutritionTargets?.proteinPerKg || formData.proteinSettings?.proteinPerKg)
                      }
                    });
                  }}
                  options={[
                    { value: 'not_tracked', label: 'Не отслеживать' },
                    { value: 'manual', label: 'Задать вручную (г/день)' },
                    { value: 'per_kg', label: 'Рассчитать по весу (г/кг)' }
                  ]}
                  className="bg-white"
                />

                {formData.nutritionTargets?.proteinMode === 'manual' && (
                  <input
                    type="number"
                    value={formData.nutritionTargets?.proteinGrams || ''}
                    onChange={e => setFormData({
                      ...formData,
                      nutritionTargets: { ...formData.nutritionTargets!, proteinGrams: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                    placeholder="Грамм в день"
                  />
                )}

                {formData.nutritionTargets?.proteinMode === 'per_kg' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.nutritionTargets?.bodyWeightKg || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, bodyWeightKg: parseFloat(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="Вес, кг"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nutritionTargets?.proteinPerKg || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, proteinPerKg: parseFloat(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="г/кг"
                    />
                  </div>
                )}
              </div>

              {/* Fats */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <label className="text-xs font-bold text-stone-600 px-2 italic">Жиры</label>
                <AppSelect
                  value={formData.nutritionTargets?.fatMode || 'not_tracked'}
                  onChange={e => setFormData({
                    ...formData,
                    nutritionTargets: { ...(formData.nutritionTargets || {}), proteinMode: formData.nutritionTargets?.proteinMode || 'not_tracked', fatMode: e.target.value as any }
                  })}
                  options={[
                    { value: 'not_tracked', label: 'Не отслеживать' },
                    { value: 'manual', label: 'Задать вручную (г/день)' },
                    { value: 'range', label: 'Диапазон (г/день)' },
                    { value: 'percent', label: '% от калорий' }
                  ]}
                  className="bg-white"
                />

                {formData.nutritionTargets?.fatMode === 'manual' && (
                  <input
                    type="number"
                    value={formData.nutritionTargets?.fatGrams || ''}
                    onChange={e => setFormData({
                      ...formData,
                      nutritionTargets: { ...formData.nutritionTargets!, fatGrams: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                    placeholder="Грамм в день"
                  />
                )}

                {formData.nutritionTargets?.fatMode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.nutritionTargets?.fatMinGrams || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, fatMinGrams: parseInt(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="Мин, г"
                    />
                    <input
                      type="number"
                      value={formData.nutritionTargets?.fatMaxGrams || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, fatMaxGrams: parseInt(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="Макс, г"
                    />
                  </div>
                )}

                {formData.nutritionTargets?.fatMode === 'percent' && (
                  <input
                    type="number"
                    value={formData.nutritionTargets?.fatPercent || ''}
                    onChange={e => setFormData({
                      ...formData,
                      nutritionTargets: { ...formData.nutritionTargets!, fatPercent: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                    placeholder="Процент (напр. 30)"
                  />
                )}
              </div>

              {/* Carbs */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <label className="text-xs font-bold text-stone-600 px-2 italic">Углеводы</label>
                <AppSelect
                  value={formData.nutritionTargets?.carbMode || 'not_tracked'}
                  onChange={e => setFormData({
                    ...formData,
                    nutritionTargets: { ...(formData.nutritionTargets || {}), proteinMode: formData.nutritionTargets?.proteinMode || 'not_tracked', fatMode: formData.nutritionTargets?.fatMode || 'not_tracked', carbMode: e.target.value as any }
                  })}
                  options={[
                    { value: 'not_tracked', label: 'Не отслеживать' },
                    { value: 'manual', label: 'Задать вручную (г/день)' },
                    { value: 'range', label: 'Диапазон (г/день)' },
                    { value: 'remaining', label: 'Остаток от калорий' }
                  ]}
                  className="bg-white"
                />

                {formData.nutritionTargets?.carbMode === 'manual' && (
                  <input
                    type="number"
                    value={formData.nutritionTargets?.carbGrams || ''}
                    onChange={e => setFormData({
                      ...formData,
                      nutritionTargets: { ...formData.nutritionTargets!, carbGrams: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                    placeholder="Грамм в день"
                  />
                )}

                {formData.nutritionTargets?.carbMode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.nutritionTargets?.carbMinGrams || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, carbMinGrams: parseInt(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="Мин, г"
                    />
                    <input
                      type="number"
                      value={formData.nutritionTargets?.carbMaxGrams || ''}
                      onChange={e => setFormData({
                        ...formData,
                        nutritionTargets: { ...formData.nutritionTargets!, carbMaxGrams: parseInt(e.target.value) || undefined }
                      })}
                      className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-xs font-medium outline-none"
                      placeholder="Макс, г"
                    />
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Nutrition Settings */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Питание и цели</h4>
            <div className="bg-stone-50 p-5 rounded-[32px] border border-stone-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2">Норма Ккал в день</label>
                <input
                  type="number"
                  value={formData.dailyKcal || ''}
                  onChange={e => setFormData({ ...formData, dailyKcal: parseInt(e.target.value) || undefined })}
                  className="w-full bg-white border border-stone-100 rounded-xl p-3 text-sm font-serif font-black text-natural-primary focus:ring-2 focus:ring-natural-primary/10 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400">{i18n.profiles.mealDistribution.breakfast} ({i18n.common.kcalAbbr})</label>
                  <input
                    type="number"
                    value={formData.mealDistribution?.breakfast || ''}
                    onChange={e => handleDistChange('breakfast', e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400">{i18n.profiles.mealDistribution.lunch} ({i18n.common.kcalAbbr})</label>
                  <input
                    type="number"
                    value={formData.mealDistribution?.lunch || ''}
                    onChange={e => handleDistChange('lunch', e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400">{i18n.profiles.mealDistribution.snack} ({i18n.common.kcalAbbr})</label>
                  <input
                    type="number"
                    value={formData.mealDistribution?.snack || ''}
                    onChange={e => handleDistChange('snack', e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400">{i18n.profiles.mealDistribution.dinner} ({i18n.common.kcalAbbr})</label>
                  <input
                    type="number"
                    value={formData.mealDistribution?.dinner || ''}
                    onChange={e => handleDistChange('dinner', e.target.value)}
                    className="w-full bg-white border border-stone-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-natural-primary/10 outline-none"
                  />
                </div>
              </div>
            </div>
            {validationWarning && (
              <div className="flex items-start space-x-3 text-[10px] bg-amber-50 text-amber-700 p-4 rounded-2xl border border-amber-100 font-bold leading-relaxed">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{validationWarning}</span>
              </div>
            )}
          </section>

          {/* Arrays Section */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Предпочтения и Ограничения</h4>
            <div className="space-y-4">
               <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2">Аллергии (каждая с новой строки)</label>
                <textarea
                  value={formData.allergies?.join('\n') || ''}
                  onChange={e => handleTextAreaChange('allergies', e.target.value)}
                  rows={2}
                  className="w-full bg-red-50/30 border border-red-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-red-100 outline-none placeholder:text-stone-300"
                  placeholder="Орехи, мед..."
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2">Нелюбимые продукты</label>
                <textarea
                  value={formData.dislikedFoods?.join('\n') || ''}
                  onChange={e => handleTextAreaChange('dislikedFoods', e.target.value)}
                  rows={2}
                  className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none placeholder:text-stone-300"
                  placeholder="Лук, кинза..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 px-2">Предпочтения</label>
                <textarea
                  value={formData.preferences?.join('\n') || ''}
                  onChange={e => handleTextAreaChange('preferences', e.target.value)}
                  rows={2}
                  className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none placeholder:text-stone-300"
                  placeholder="ПП, Вегетарианство..."
                />
              </div>
            </div>
          </section>

          {/* Portions */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Настройки порции</h4>
            <div className="bg-stone-50 p-5 rounded-[32px] border border-stone-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-stone-700">Коэффициент размера порции</div>
                <div className="text-[10px] text-stone-400">1.0 = норма, 0.5 = половина</div>
              </div>
              <input
                type="number"
                step="0.1"
                value={formData.portionMultiplier || ''}
                onChange={e => setFormData({ ...formData, portionMultiplier: parseFloat(e.target.value) || 1.0 })}
                className="w-20 bg-white border border-stone-100 rounded-xl p-2 text-sm font-black text-center text-natural-primary focus:ring-2 focus:ring-natural-primary/10 outline-none"
              />
            </div>
          </section>

          {/* Behavior */}
          <section className="space-y-4 pb-12">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Поведение при готовке</h4>
            <div className="space-y-2">
              {[
                { label: 'Обычно ест со всеми', field: 'usuallyEatsTogether' },
                { label: 'Можно то же блюдо, другая порция', field: 'allowSameDishDifferentPortion' },
                { label: 'Можно отдельное блюдо', field: 'allowSeparateDish' },
                { label: 'Активный профиль', field: 'isActive' }
              ].map(item => (
                <label key={item.field} className="flex items-center justify-between p-4 bg-white border border-stone-50 rounded-2xl shadow-sm cursor-pointer hover:bg-stone-50 transition-colors">
                  <span className="text-xs font-bold text-stone-600">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!(formData as any)[item.field]}
                    onChange={e => setFormData({ ...formData, [item.field]: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-stone-200 text-natural-primary focus:ring-natural-primary/20 transition-all accent-natural-primary"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-stone-100 safe-bottom z-20">
          <div className="max-w-md mx-auto">
            <button
              type="submit"
              className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-natural-primary/10 active:scale-95 transition-all"
            >
              {i18n.common.save}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
