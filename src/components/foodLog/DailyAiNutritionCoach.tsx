/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Copy, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NutritionCoachAnalysis, nutritionCoachService } from '../../services/nutritionCoachService';
import { UserProfile } from '../../types/profile';
import { FoodLogEntry } from '../../types/foodLog';
import { FoodItem } from '../../types/food';
import { i18n } from '../../i18n/ru';

interface DailyAiNutritionCoachProps {
  profile: UserProfile;
  entries: FoodLogEntry[];
  fridgeItems: FoodItem[];
  nextMealType?: string;
}

export const DailyAiNutritionCoach: React.FC<DailyAiNutritionCoachProps> = ({
  profile,
  entries,
  fridgeItems,
  nextMealType = 'dinner'
}) => {
  const [analysis, setAnalysis] = useState<NutritionCoachAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await nutritionCoachService.analyzeDay(profile, entries, fridgeItems, nextMealType);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {!analysis && !loading && (
        <button
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center space-x-3 bg-white py-6 rounded-[32px] border-2 border-dashed border-stone-200 text-stone-400 hover:border-natural-primary/30 hover:text-natural-primary transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-natural-primary/10 transition-colors">
            <Sparkles size={20} className="group-hover:animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black uppercase tracking-widest">{i18n.diary.coach}</p>
            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{i18n.diary.coachSubtitle}</p>
          </div>
        </button>
      )}

      {loading && (
        <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-dashed border-natural-primary rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-natural-primary">{i18n.diary.coach}</p>
            <p className="text-xs font-bold text-stone-300 italic">Анализирую ваш день и содержимое холодильника...</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {analysis && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-natural-primary/5 p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-natural-primary text-white flex items-center justify-center shadow-lg shadow-natural-primary/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-natural-primary">{i18n.diary.coach}</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{i18n.diary.aiRecommendation}</p>
                </div>
              </div>
              <button 
                onClick={() => setAnalysis(null)}
                className="text-stone-300 hover:text-stone-500 transition-colors"
                title="Сбросить"
              >
                <Info size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 p-1 bg-blue-50 text-blue-500 rounded-lg">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{i18n.diary.currentStatus}</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">{analysis.statusText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {analysis.exceededNutrients.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100/50">
                      <div className="flex items-center space-x-1.5 mb-1 text-red-600">
                        <AlertTriangle size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{i18n.diary.exceededNutrients}</span>
                      </div>
                      <p className="text-[10px] font-bold text-red-700">{analysis.exceededNutrients.join(', ')}</p>
                    </div>
                  )}
                  {analysis.nearLimitNutrients.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100/50">
                      <div className="flex items-center space-x-1.5 mb-1 text-amber-600">
                        <AlertTriangle size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{i18n.diary.nearLimitNutrients}</span>
                      </div>
                      <p className="text-[10px] font-bold text-amber-700">{analysis.nearLimitNutrients.join(', ')}</p>
                    </div>
                  )}
                  {analysis.missingNutrients.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-100/50">
                      <div className="flex items-center space-x-1.5 mb-1 text-green-600">
                        <CheckCircle2 size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{i18n.diary.missingNutrients}</span>
                      </div>
                      <p className="text-[10px] font-bold text-green-700">{analysis.missingNutrients.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Общая рекомендация</h4>
                <p className="text-sm font-medium text-stone-700 leading-relaxed italic">
                  "{analysis.nextMealRecommendation}"
                </p>
              </div>

              {/* Suggested Dishes */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">{i18n.diary.nextMealSuggestions}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {analysis.suggestedDishes.map((dish, idx) => (
                    <div key={idx} className="bg-white border border-stone-100 rounded-[24px] p-4 group hover:border-natural-primary/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="text-sm font-black text-stone-800">{dish.name}</h5>
                          <p className="text-[10px] text-stone-400 mt-0.5">{dish.explanation}</p>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[11px] font-black text-natural-primary">{dish.pfc.kcal} ккал</span>
                           <span className="text-[8px] font-bold text-stone-300 uppercase">Б:{dish.pfc.protein} Ж:{dish.pfc.fat} У:{dish.pfc.carbs}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-50">
                        <button
                          onClick={() => handleCopy(dish.copyText, idx)}
                          className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-natural-primary hover:bg-natural-primary/5 px-3 py-2 rounded-xl transition-all"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={14} />
                              <span>{i18n.diary.copySuccess}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>{i18n.diary.copyToChef}</span>
                            </>
                          )}
                        </button>
                        <ArrowRight size={14} className="text-stone-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
