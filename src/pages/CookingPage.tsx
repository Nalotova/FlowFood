/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Wand2, ArrowLeft, CheckCircle2, RotateCcw, Edit3, Apple, Plus, FlaskConical, ShieldAlert, Info, Trash2, UtensilsCrossed } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useFridge } from '../hooks/useFridge';
import { useApp } from '../contexts/AppContext';
import { MealType, CookingMode, CookingResult, TargetStrategy, GenerationMode } from '../types/cooking';
import { cookingService } from '../services/cookingService';
import { aiCookingService } from '../services/aiCookingService';
import { MealTypeSelector } from '../components/cooking/MealTypeSelector';
import { ParticipantSelector } from '../components/cooking/ParticipantSelector';
import { CookingModeSelector } from '../components/cooking/CookingModeSelector';
import { FoodPreferenceSelector } from '../components/cooking/FoodPreferenceSelector';
import { TargetStrategySelector } from '../components/cooking/TargetStrategySelector';
import { TargetKcalPreview } from '../components/cooking/TargetKcalPreview';
import { CookingResultCard } from '../components/cooking/CookingResultCard';
import { TotalIngredientsTable } from '../components/cooking/TotalIngredientsTable';
import { PortionsByPersonTable } from '../components/cooking/PortionsByPersonTable';
import { InventoryAfterTable } from '../components/cooking/InventoryAfterTable';
import { DiagnosticsPanel } from '../components/cooking/DiagnosticsPanel';
import { ChefChat } from '../components/chef/ChefChat';
import { ProposedRevisionCard } from '../components/chef/ProposedRevisionCard';
import { QuickSnackForm } from '../components/foodLog/QuickSnackForm';
import { DailySummaryCard } from '../components/foodLog/DailySummaryCard';
import { useFoodLog } from '../hooks/useFoodLog';
import { FoodLogEntry, DailyNutritionSummary } from '../types/foodLog';
import { validateCookingResult } from '../utils/cookingValidation';
import { scoreMealVariety } from '../utils/mealSuitability';
import { i18n } from '../i18n/ru';
import { cookingHistoryService } from '../services/cookingHistoryService';

import { ChefChatMessage, ChefChatResponse } from '../types/chefChat';
import { chefChatService } from '../services/chefChatService';
import { dishPlanningService } from '../services/dishPlanningService';
import { DishFeasibility } from '../types/dishPlanning';
import { DishFeasibilityCard } from '../components/cooking/DishFeasibilityCard';

export const CookingPage: React.FC = () => {
  const { user, activeHousehold, permissions, userRole } = useApp();
  const householdId = activeHousehold?.id;

  const { profiles, addProfile, loading: profilesLoading } = useProfiles();
  const { items, setAmount, addFoodItem, loading: fridgeLoading } = useFridge();
  const { addEntry, entries, deleteEntry, getSummary, loading: logLoading } = useFoodLog();

  const isInitialLoading = profilesLoading || fridgeLoading || logLoading;

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mode, setMode] = useState<CookingMode>('same_dish_different_portions');
  const [targetStrategy, setTargetStrategy] = useState<TargetStrategy>('planned_meal_kcal');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('ai');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [preferredFoodIds, setPreferredFoodIds] = useState<string[]>([]);
  const [excludedFoodIds, setExcludedFoodIds] = useState<string[]>([]);
  const [userComment, setUserComment] = useState('');
  const [requestedDishName, setRequestedDishName] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feasibility, setFeasibility] = useState<DishFeasibility | null>(null);
  const [result, setResult] = useState<CookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSnackFormOpen, setIsSnackOpen] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, DailyNutritionSummary>>({});
  const [isAccepted, setIsAccepted] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChefChatMessage[]>([]);
  const [pendingRevision, setPendingRevision] = useState<{
    proposedResult: CookingResult;
    message: string;
  } | null>(null);

  const isDev = true; 

  const addTestData = async () => {
    if (!confirm('Добавить тестовые данные?')) return;
    
    // Add Test Profiles if not exist
    const testProfiles = [
      { name: 'Взрослый', role: 'adult', isActive: true, dailyKcal: 2000, mealDistribution: { breakfast: 0.2, lunch: 0.35, snack: 0.1, dinner: 0.35 }, portionMultiplier: 1, forbiddenFoods: [], allergies: ['Грибы'], preferences: [], likedFoods: [], dislikedFoods: [], usuallyEatsTogether: true, allowSameDishDifferentPortion: true, allowSeparateDish: true },
      { name: 'Ребёнок', role: 'child', isActive: true, dailyKcal: 1200, mealDistribution: { breakfast: 0.25, lunch: 0.25, snack: 0.25, dinner: 0.25 }, portionMultiplier: 0.7, forbiddenFoods: ['Лук'], allergies: [], preferences: [], likedFoods: [], dislikedFoods: [], usuallyEatsTogether: true, allowSameDishDifferentPortion: true, allowSeparateDish: true }
    ];

    for (const tp of testProfiles) {
      if (!profiles.some(p => p.name === tp.name)) {
        await addProfile(tp as any);
      }
    }

    // Add Test food if not enough
    const testFood = [
      { name: 'Куриное филе', amount: 1000, unit: 'g', kcalPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbsPer100g: 0, categories: ['protein', 'meat'], state: 'fresh', source: 'manual' },
      { name: 'Гречка', amount: 500, unit: 'g', kcalPer100g: 330, proteinPer100g: 12, fatPer100g: 3, carbsPer100g: 64, categories: ['grain', 'carb'], state: 'dry', source: 'manual' },
      { name: 'Брокколи', amount: 400, unit: 'g', kcalPer100g: 34, proteinPer100g: 2.8, fatPer100g: 0.4, carbsPer100g: 7, categories: ['vegetable'], state: 'fresh', source: 'manual' },
      { name: 'Йогурт', amount: 500, unit: 'ml', kcalPer100g: 63, proteinPer100g: 3, fatPer100g: 3.2, carbsPer100g: 4.5, categories: ['dairy'], state: 'fresh', source: 'manual' },
      { name: 'Яблоко', amount: 1000, unit: 'g', kcalPer100g: 52, proteinPer100g: 0.3, fatPer100g: 0.2, carbsPer100g: 14, categories: ['fruit'], state: 'fresh', source: 'manual' }
    ];

    for (const tf of testFood) {
      if (!items.some(f => f.name === tf.name)) {
        await addFoodItem(tf as any);
      }
    }
    
    alert('Тестовые данные добавлены!');
  };

  // Calculate summaries for selected participants locally from entries
  React.useEffect(() => {
    const newSummaries: Record<string, DailyNutritionSummary> = {};
    
    for (const id of participantIds) {
      const profile = profiles.find(p => p.id === id);
      if (!profile) continue;

      const profileEntries = entries.filter(e => e.profileId === id);
      const totals = profileEntries.reduce((acc, entry) => {
        acc.kcal += entry.kcal;
        acc.protein += (entry.protein || 0);
        acc.fat += (entry.fat || 0);
        acc.carbs += (entry.carbs || 0);
        return acc;
      }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });

      newSummaries[id] = {
        profileId: id,
        date: new Date().toISOString().split('T')[0],
        targetKcal: profile.dailyKcal,
        consumedKcal: totals.kcal,
        remainingKcal: profile.dailyKcal ? Math.max(0, profile.dailyKcal - totals.kcal) : undefined,
        protein: Math.round(totals.protein * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
      };
    }
    setSummaries(newSummaries);
  }, [participantIds, entries, profiles]);

  const handleGenerate = async (bypassFeasibility = false) => {
    if (participantIds.length === 0) return alert('Выберите хотя бы одного участника');
    if (items.filter(i => i.amount > 0).length === 0) return alert(i18n.fridge.noProducts);

    // Initial identification of dish feasibility if a specific dish is requested
    if (requestedDishName.trim() && !feasibility && !bypassFeasibility) {
      try {
        setIsAnalyzing(true);
        setError(null);
        const analysis = await dishPlanningService.analyzeRequestedDish({
          requestedDish: requestedDishName,
          selectedProfiles: profiles.filter(p => participantIds.includes(p.id)),
          foodItems: items,
          mealType: mealType,
          userComment: userComment
        });
        setFeasibility(analysis);
        setIsAnalyzing(false);
        return;
      } catch (err) {
        console.error("Analysis failed:", err);
        // Continue anyway if analysis fails? or stop?
        setIsAnalyzing(false);
      }
    }

    try {
      setIsGenerating(true);
      setError(null);
      setIsAccepted(false);
      setChatHistory([]);
      setPendingRevision(null);

      const requestParams = {
        mealType,
        mode,
        targetStrategy,
        participantIds,
        preferredFoodIds,
        excludedFoodIds,
        userComment: requestedDishName 
          ? `[БЛЮДО: ${requestedDishName}] ${userComment}` 
          : userComment
      };

      // 1. Calculate target info
      const targetInfo = await cookingService.calculateTargetInfo({
        request: requestParams,
        profiles,
        foodLogEntries: entries
      });

      let res: CookingResult;
      
      try {
        res = await aiCookingService.generateAiCookingPlan({
          request: {
            ...requestParams,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
          },
          profiles,
          foodItems: items,
          foodLogEntries: entries,
          targetInfo,
          feasibility: feasibility || undefined
        });
      } catch (aiErr) {
        console.error("AI Generation failed:", aiErr);
        setError(aiErr instanceof Error ? aiErr.message : i18n.validation.aiFailed);
        setIsGenerating(false);
        return;
      }
      
      // 3. Validation
      const report = validateCookingResult(res, items, profiles);
      res.validationReport = report;

      // 4. Variety Scoring
      const recentMeals = entries
        .filter(e => e.type === 'planned_meal')
        .slice(-5)
        .map(e => ({
          mealName: e.foodName,
          mealType: e.mealType as MealType,
          mainIngredients: [] 
        }));
      
      const varietyReport = scoreMealVariety(res, recentMeals);
      if (varietyReport.warnings.length > 0) {
        res.warnings = [...(res.warnings || []), ...varietyReport.warnings];
      }

      setResult(res);
      setFeasibility(null); // Clear feasibility after success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : i18n.common.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = async (bypassValidation = false) => {
    if (!result || isAccepted || !permissions.canEdit) return;
    
    const report = result.validationReport || validateCookingResult(result, items, profiles);
    
    if (!bypassValidation && !report.isValid) {
      setShowValidationModal(true);
      return;
    }

    if (report.inventoryWarnings.length > 0 && !bypassValidation) {
       // Cannot bypass inventory warnings
       setShowValidationModal(true);
       return;
    }
    
    try {
      // 1. Write off ingredients
      for (const move of result.inventoryAfter) {
        await setAmount(move.foodItemId, move.remainingAmount);
      }

      // 2. Add to food log for each participant
      for (const portion of result.portions) {
        const totalGrams = portion.items.reduce((sum, item) => sum + item.grams, 0);
        await addEntry({
          profileId: portion.profileId,
          profileName: portion.profileName,
          date: new Date().toISOString().split('T')[0],
          type: 'planned_meal',
          mealType: result.mealType,
          kcal: portion.totals.kcal,
          protein: portion.totals.protein,
          fat: portion.totals.fat,
          carbs: portion.totals.carbs,
          foodName: result.mealName,
          amount: 1,
          unit: 'порция',
          grams: totalGrams,
          subtractFromFridge: false,
        });
      }

      // 3. Save to History
      await cookingHistoryService.saveResult(result, householdId);

      setIsAccepted(true);
      setShowValidationModal(false);
      alert(i18n.cooking.accepted);
    } catch (err) {
      alert(i18n.common.error);
    }
  };

  const handleManualEdit = () => {
    console.log("Manual edit requested");
    alert('Ручное редактирование будет доступно в следующих обновлениях. Попробуйте уточнить запрос через чат ниже.');
  };

  const handleSendMessage = async (message: string) => {
    if (!result || !message.trim() || isRefining || isAccepted) return;

    // 1. Add user message
    const userMsg: ChefChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      setIsRefining(true);
      
      const response: ChefChatResponse = await chefChatService.sendChefChatMessage({
        message,
        chatHistory,
        currentResult: result,
        profiles,
        foodItems: items,
        foodLogEntries: entries
      });

      // 2. Add assistant message
      const assistantMsg: ChefChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        createdAt: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, assistantMsg]);

      if (response.status === 'revision' && response.proposedResult) {
        setPendingRevision({
          proposedResult: response.proposedResult,
          message: response.message
        });
      }

    } catch (err) {
      console.error(err);
      const errMsg: ChefChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: i18n.common.error,
        createdAt: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptRevision = () => {
    if (!pendingRevision) return;
    
    // Validate proposed result
    const report = validateCookingResult(pendingRevision.proposedResult, items, profiles);
    if (!report.isValid) {
      alert(`Новый вариант содержит ошибки: ${report.generalWarnings.join(', ')}`);
      return;
    }

    setResult(pendingRevision.proposedResult);
    setPendingRevision(null);
    
    // Add system message to chat
    const sysMsg: ChefChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: i18n.cooking.chefChat.changesApplied,
      createdAt: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, sysMsg]);
  };

  const handleRejectRevision = () => {
    setPendingRevision(null);
    // Add system message to chat
    const sysMsg: ChefChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: i18n.cooking.chefChat.stayedWithOriginal,
      createdAt: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, sysMsg]);
  };

  if (isInitialLoading && !result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RotateCcw size={32} className="text-natural-primary animate-spin" />
        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
          {i18n.cooking.loading}
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showValidationModal && result && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={() => setShowValidationModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert size={32} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-serif font-black text-stone-800">{i18n.common.warning}</h3>
                <p className="text-xs text-stone-500 italic">{i18n.cooking.warnings}:</p>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar py-2">
                {[
                  ...(result.validationReport?.inventoryWarnings || []),
                  ...(result.validationReport?.forbiddenFoodWarnings || []),
                  ...(result.validationReport?.generalWarnings || [])
                ].map((w, i) => (
                  <div key={i} className="flex items-start space-x-2 text-red-600">
                    <div className="w-1 h-1 rounded-full bg-red-600 mt-1.5 shrink-0" />
                    <span className="text-[10px] font-bold leading-tight">{w}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                {result.validationReport?.inventoryWarnings.length === 0 ? (
                  <button
                    onClick={() => handleAccept(true)}
                    className="w-full py-4 bg-natural-primary text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-lg"
                  >
                    Всё равно принять
                  </button>
                ) : (
                  <p className="text-[9px] font-bold text-red-400 text-center uppercase tracking-widest leading-relaxed">
                    Невозможно списать: <br/> критический дефицит продуктов
                  </p>
                )}
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="w-full py-4 bg-stone-100 text-stone-500 rounded-[24px] font-black uppercase tracking-widest text-[10px]"
                >
                  {i18n.common.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSnackFormOpen && (
          <QuickSnackForm 
            profiles={profiles}
            foodItems={items}
            onCancel={() => setIsSnackOpen(false)}
            onSave={async (entry) => {
              await addEntry(entry);
              if (entry.subtractFromFridge && entry.foodItemId) {
                const food = items.find(f => f.id === entry.foodItemId);
                if (food) {
                  await setAmount(entry.foodItemId, Math.max(0, food.amount - entry.amount));
                }
              }
              setIsSnackOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="space-y-8 pt-2 pb-32">
        {!result ? (
          <>
            <div className="flex justify-between items-center px-2">
              <h1 className="text-3xl font-serif font-bold text-natural-primary">{i18n.cooking.title}</h1>
              <div className="flex gap-2">
                {isDev && permissions.canEdit && (
                  <button 
                    onClick={addTestData}
                    className="w-10 h-10 bg-natural-muted rounded-full flex items-center justify-center text-natural-primary border border-stone-100 hover:scale-110 transition-all font-bold"
                    title={i18n.cooking.testData}
                  >
                    <FlaskConical size={18} />
                  </button>
                )}
                <div className="w-10 h-10 bg-natural-accent rounded-full flex items-center justify-center text-natural-primary shadow-sm hover:scale-110 transition-transform">
                  <ChefHat size={20} />
                </div>
              </div>
            </div>

            {(permissions.canEdit || userRole === 'owner') && (
              <button 
                onClick={() => setIsSnackOpen(true)}
                className="w-full flex items-center justify-center space-x-3 bg-natural-primary py-5 rounded-[24px] text-white hover:bg-natural-primary/90 transition-all active:scale-95 shadow-lg shadow-natural-primary/10"
              >
                <Plus size={20} />
                <span className="text-sm font-black uppercase tracking-widest">{i18n.foodLog.addUnplanned}</span>
              </button>
            )}

            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MealTypeSelector value={mealType} onChange={setMealType} />
              
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 italic">
                  {i18n.cooking.requestedDish}
                </h4>
                <div className="relative">
                  <UtensilsCrossed size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    value={requestedDishName}
                    onChange={(e) => setRequestedDishName(e.target.value)}
                    placeholder={i18n.cooking.requestedDishPlaceholder}
                    className="w-full bg-natural-muted border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-stone-800 placeholder:text-stone-300 focus:ring-2 focus:ring-natural-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              <ParticipantSelector 
                profiles={profiles} 
                selectedIds={participantIds} 
                onChange={setParticipantIds} 
              />
              <CookingModeSelector value={mode} onChange={setMode} />
              <TargetStrategySelector value={targetStrategy} onChange={setTargetStrategy} />
              
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 italic">{i18n.cooking.comment}</h4>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Напр. хочу что-то острое или побыстрее..."
                  rows={2}
                  className="w-full bg-natural-muted border border-stone-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-natural-primary/10 outline-none"
                />
              </div>

              <FoodPreferenceSelector 
                foodItems={items}
                preferredIds={preferredFoodIds}
                excludedIds={excludedFoodIds}
                onPreferenceChange={(pref, excl) => {
                  setPreferredFoodIds(pref);
                  setExcludedFoodIds(excl);
                }}
              />

              <TargetKcalPreview 
                profiles={profiles}
                selectedIds={participantIds}
                mealType={mealType}
                entries={entries}
                strategy={targetStrategy}
              />

              {participantIds.length > 0 && (
                <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-700">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    disabled={isGenerating || isAnalyzing}
                    onClick={() => handleGenerate()}
                    className={`w-full py-5 rounded-[32px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 transition-all ${
                      isGenerating || isAnalyzing
                        ? 'bg-stone-100 text-stone-400 cursor-wait' 
                        : 'bg-natural-primary text-white shadow-stone-200 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {isGenerating || isAnalyzing ? (
                      <>
                        <RotateCcw size={18} className="animate-spin" />
                        <span>
                          {isAnalyzing ? "Анализ блюда..." : (generationMode === 'ai' ? 'ИИ-повар думает...' : i18n.cooking.generating)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        <span>{i18n.cooking.generate}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {feasibility && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setFeasibility(null)} />
                  <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
                    <DishFeasibilityCard 
                      feasibility={feasibility}
                      onCookAnyway={() => handleGenerate(true)}
                      onCookWithSubstitutes={() => handleGenerate(true)}
                      onCancel={() => setFeasibility(null)}
                      onSuggestAlternative={() => {
                        setRequestedDishName('');
                        setFeasibility(null);
                        handleGenerate();
                      }}
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center space-x-4 px-2">
              <button 
                onClick={() => setResult(null)} 
                className="p-2 text-stone-400 hover:text-natural-primary transition-colors bg-stone-50 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-serif font-bold text-natural-primary">Результат расчёта</h1>
            </div>

            {pendingRevision && (
              <ProposedRevisionCard 
                proposedResult={pendingRevision.proposedResult}
                message={pendingRevision.message}
                onAccept={handleAcceptRevision}
                onReject={handleRejectRevision}
              />
            )}

            <CookingResultCard 
              result={result} 
              onRefine={handleSendMessage}
              isRefining={isRefining}
              isAccepted={isAccepted}
            />
            
            {!isAccepted && (
              <div className="space-y-2">
                <ChefChat 
                  history={chatHistory}
                  onSendMessage={handleSendMessage}
                  isLoading={isRefining}
                />
                {pendingRevision && (
                  <p className="text-[10px] font-bold text-amber-500 bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center gap-2">
                    <Info size={14} />
                    {i18n.cooking.chefChat.pendingRevisionHinter}
                  </p>
                )}
              </div>
            )}

            <DiagnosticsPanel result={result} />
            <TotalIngredientsTable ingredients={result.totalIngredients} />
            <PortionsByPersonTable portions={result.portions} />
            <InventoryAfterTable movements={result.inventoryAfter} />

            <div className="space-y-4 pt-4">
              {permissions.canEdit && (
                <button
                  onClick={handleAccept}
                  disabled={isAccepted}
                  className={`w-full py-5 rounded-[32px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 transition-all ${
                    isAccepted 
                      ? 'bg-stone-100 text-stone-400 shadow-none cursor-default' 
                      : 'bg-natural-primary text-white shadow-stone-200 active:scale-95'
                  }`}
                >
                  {isAccepted ? (
                    <>
                      <CheckCircle2 size={18} className="text-natural-primary" />
                      <span>{i18n.cooking.accepted}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>{i18n.cooking.accept}</span>
                    </>
                  )}
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGenerate()}
                  className="py-4 bg-white text-stone-500 border border-stone-100 rounded-[28px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-2 hover:bg-stone-50 transition-all font-bold"
                >
                  <RotateCcw size={14} />
                  <span>{i18n.cooking.recalculate}</span>
                </button>
                {permissions.canEdit && (
                  <button
                    onClick={handleManualEdit}
                    className="py-4 bg-white text-stone-500 border border-stone-100 rounded-[28px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-2 hover:bg-stone-50 transition-all"
                  >
                    <Edit3 size={14} />
                    <span>{i18n.common.edit}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
