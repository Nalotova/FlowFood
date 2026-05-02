/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CookingResult } from '../../types/cooking';
import { AlertTriangle, Sparkles, ChefHat, Bot, Zap, TriangleAlert, Wand2, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTargetDeviationPercent } from '../../utils/cookingValidation';
import { i18n } from '../../i18n/ru';

interface CookingResultCardProps {
  result: CookingResult;
  onRefine?: (message: string) => void;
  isRefining?: boolean;
  isAccepted?: boolean;
}

export const CookingResultCard: React.FC<CookingResultCardProps> = ({ 
  result, 
  onRefine, 
  isRefining,
  isAccepted 
}) => {
  const [refineMessage, setRefineMessage] = React.useState('');
  const hasBigDeviations = result.portions.some(p => getTargetDeviationPercent(p.targetKcal, p.actualKcal) > 15);
  const hasInventoryIssues = result.inventoryAfter.some(m => m.remainingAmount < 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="bg-white p-6 rounded-[40px] border border-stone-100 shadow-xl shadow-stone-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ChefHat size={120} strokeWidth={1} />
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center space-x-2 bg-natural-primary/5 text-natural-primary px-3 py-1 rounded-full">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{i18n.cooking.recipeReady}</span>
            </div>

            <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border ${
              result.source === 'ai' ? 'bg-purple-50 text-purple-600 border-purple-100' :
              'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {result.source === 'ai' ? <Bot size={12} /> : <TriangleAlert size={12} />}
              <span className="text-[9px] font-black uppercase tracking-tight">
                {i18n.cooking.sources[result.source as keyof typeof i18n.cooking.sources] || result.source}
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl font-serif font-black text-stone-800 leading-tight mb-2">
            {result.mealName}
          </h2>

          {result.mealIdea && (
            <p className="text-xs text-stone-400 font-medium italic mb-4 leading-relaxed">
              <span className="font-black uppercase text-[8px] text-stone-300 mr-2 not-italic">{i18n.cooking.mealIdea}:</span>
              {result.mealIdea}
            </p>
          )}

          {(hasBigDeviations || hasInventoryIssues) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hasBigDeviations && (
                <div className="inline-flex items-center space-x-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                  <TriangleAlert size={10} />
                  <span className="text-[8px] font-black uppercase">{i18n.validation.highDeviation}</span>
                </div>
              )}
              {hasInventoryIssues && (
                <div className="inline-flex items-center space-x-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                  <AlertTriangle size={10} />
                  <span className="text-[8px] font-black uppercase">{i18n.validation.inventoryDeficit}</span>
                </div>
              )}
            </div>
          )}

          {result.targetInfo && result.targetInfo.length > 0 && (
            <div className="mt-6 pt-6 border-t border-stone-50 space-y-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.kcalTarget}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.targetInfo.map(info => (
                   <div key={info.profileId} className="bg-stone-50 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="text-[9px] font-black text-stone-400 uppercase">{info.profileName}</div>
                        <div className="text-[9px] font-bold text-stone-300">План: {info.plannedMealKcal}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm font-black text-natural-primary">{info.targetMealKcal} {i18n.common.kcalAbbr}</div>
                        <div className="text-[8px] font-bold text-stone-300">Осталось: {info.remainingDayKcal}</div>
                      </div>

                      {/* Macro Goals vs Actual */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                        <div>
                          <div className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{i18n.macros.protein}</div>
                          <div className="text-[10px] font-black text-stone-600">
                             {result.portions.find(p => p.profileId === info.profileId)?.totals.protein}г
                          </div>
                          {info.proteinTarget && (
                            <div className="text-[7px] text-stone-400 font-bold">цель {info.proteinTarget}г</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{i18n.macros.fat}</div>
                          <div className="text-[10px] font-black text-stone-600">
                             {result.portions.find(p => p.profileId === info.profileId)?.totals.fat}г
                          </div>
                          {(info.fatMin || info.fatMax || info.fatTarget) && (
                            <div className="text-[7px] text-stone-400 font-bold">
                              {info.fatTarget ? `цель ${info.fatTarget}г` : `${info.fatMin || 0}-${info.fatMax || '?'}г`}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{i18n.macros.carbs}</div>
                          <div className="text-[10px] font-black text-stone-600">
                             {result.portions.find(p => p.profileId === info.profileId)?.totals.carbs}г
                          </div>
                          {(info.carbMin || info.carbMax || info.carbTarget) && (
                            <div className="text-[7px] text-stone-400 font-bold">
                              {info.carbTarget ? `цель ${info.carbTarget}г` : `${info.carbMin || 0}-${info.carbMax || '?'}г`}
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="space-y-2 mt-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              {result.warnings.map((warning, i) => (
                <div key={i} className="flex items-start space-x-2 text-orange-600">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span className="text-[10px] font-bold leading-tight uppercase tracking-tight">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Section */}
      {(result.recipe || result.explanation) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-natural-primary">
              <div className="w-10 h-10 bg-natural-primary/5 rounded-2xl flex items-center justify-center">
                <ChefHat size={20} />
              </div>
              <h3 className="font-serif font-black text-xl text-stone-800">{i18n.cooking.howToCook}</h3>
            </div>
            {result.recipe && (
              <div className="flex space-x-4">
                {result.recipe.prepTimeMinutes && (
                  <div className="text-center">
                    <div className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{i18n.cooking.prepTime}</div>
                    <div className="text-xs font-black text-stone-600">{result.recipe.prepTimeMinutes} мин</div>
                  </div>
                )}
                {result.recipe.cookTimeMinutes && (
                  <div className="text-center">
                    <div className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{i18n.cooking.cookTime}</div>
                    <div className="text-xs font-black text-stone-600">{result.recipe.cookTimeMinutes} мин</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {result.recipe ? (
              <div className="space-y-4">
                {result.recipe.steps.map((step, i) => (
                  <div key={i} className="flex space-x-4 group">
                    <div className="w-6 h-6 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 text-[10px] font-black text-stone-400 group-hover:bg-natural-accent group-hover:text-natural-primary transition-colors">
                      {i + 1}
                    </div>
                    <p className="text-xs text-stone-600 font-medium pt-1 leading-relaxed">{step}</p>
                  </div>
                ))}

                {(result.recipe.servingNotes?.length || 0) > 0 && (
                  <div className="pt-4 border-t border-stone-50">
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">{i18n.cooking.servingNotes}</h5>
                    <div className="space-y-2">
                       {result.recipe.servingNotes?.map((note, i) => (
                         <div key={i} className="flex items-center space-x-2 text-xs text-stone-500">
                           <div className="w-1 h-1 rounded-full bg-stone-300" />
                           <span>{note}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {(result.recipe.tasteNotes?.length || 0) > 0 && (
                  <div className="pt-4 border-t border-stone-50">
                    <h5 className="text-[10px] font-black text-natural-primary uppercase tracking-widest mb-3">{i18n.cooking.tasteNotes}</h5>
                    <div className="space-y-2 bg-natural-primary/5 p-4 rounded-2xl">
                       {result.recipe.tasteNotes?.map((note, i) => (
                         <div key={i} className="flex items-center space-x-2 text-xs text-natural-primary font-medium">
                           <Sparkles size={12} className="shrink-0" />
                           <span>{note}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {(result.recipe.portioningNotes?.length || 0) > 0 && (
                  <div className="pt-4 border-t border-stone-50">
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">{i18n.cooking.portioningNotes}</h5>
                    <div className="space-y-2">
                       {result.recipe.portioningNotes?.map((note, i) => (
                         <div key={i} className="flex items-center space-x-2 text-xs text-stone-500">
                           <CheckCircle2 size={12} className="text-natural-primary/40" />
                           <span>{note}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap font-medium bg-stone-50/50 p-4 rounded-2xl">
                  {result.explanation}
                </div>
                {!isAccepted && result.source === 'ai' && onRefine && (
                  <button
                    onClick={() => onRefine(i18n.cooking.generateRecipe)}
                    className="w-full py-4 bg-natural-muted border border-stone-100 rounded-2xl text-[10px] font-black uppercase text-stone-500 hover:text-natural-primary transition-colors flex items-center justify-center space-x-2"
                  >
                    <ChefHat size={14} />
                    <span>{i18n.cooking.generateRecipe}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Refinement Chat */}
      {!isAccepted && onRefine && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-natural-muted rounded-[40px] p-8 space-y-6 border border-stone-100 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-stone-500">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Wand2 size={14} className="text-natural-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{i18n.cooking.aiChef}</span>
            </div>
            {result.revisionHistory && result.revisionHistory.length > 0 && (
               <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                 {i18n.cooking.revisionHistory}: {result.revisionHistory.length}
               </div>
            )}
          </div>

          <div className="relative">
            <textarea
              value={refineMessage}
              onChange={(e) => setRefineMessage(e.target.value)}
              placeholder={i18n.cooking.refinePrompt}
              rows={3}
              className="w-full bg-white border border-stone-100 rounded-3xl p-5 pr-14 text-sm font-medium focus:ring-4 focus:ring-natural-primary/5 outline-none resize-none shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (refineMessage.trim() && !isRefining) {
                    onRefine(refineMessage);
                    setRefineMessage('');
                  }
                }
              }}
            />
            <button
              disabled={!refineMessage.trim() || isRefining}
              onClick={() => {
                onRefine(refineMessage);
                setRefineMessage('');
              }}
              className={`absolute right-3 bottom-3 p-3 rounded-2xl transition-all ${
                !refineMessage.trim() || isRefining
                  ? 'text-stone-300'
                  : 'bg-natural-primary text-white shadow-lg shadow-natural-primary/20 hover:scale-105 active:scale-95'
              }`}
            >
              {isRefining ? <RotateCcw size={20} className="animate-spin" /> : <Wand2 size={20} />}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: i18n.cooking.quickRefine.removeProduct, icon: '🚫' },
              { label: i18n.cooking.quickRefine.simpler, icon: '✨' },
              { label: i18n.cooking.quickRefine.moreProtein, icon: '💪' },
              { label: i18n.cooking.quickRefine.morePotato, icon: '🥔' },
              { label: i18n.cooking.quickRefine.noDairy, icon: '🥛' },
              { label: i18n.cooking.quickRefine.other, icon: '🔄' },
            ].map((action, i) => (
              <button
                key={i}
                disabled={isRefining}
                onClick={() => onRefine(action.label)}
                className="px-4 py-2 bg-white text-[10px] font-black uppercase text-stone-500 rounded-full border border-stone-100 hover:border-natural-primary/30 hover:text-natural-primary transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span className="mr-1.5">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>

          {isRefining && (
            <div className="flex flex-col items-center space-y-2 pt-2">
              <div className="flex space-x-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-natural-primary"
                  />
                ))}
              </div>
              <p className="text-[9px] font-black text-natural-primary uppercase tracking-widest">
                {i18n.cooking.refining}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {isAccepted && (
        <div className="bg-natural-primary/5 p-6 rounded-[32px] border border-natural-primary/10 flex items-center space-x-4">
           <div className="w-10 h-10 bg-natural-primary rounded-2xl flex items-center justify-center text-white shrink-0">
             <CheckCircle2 size={24} />
           </div>
           <p className="text-xs text-natural-primary font-bold">
             {i18n.cooking.alreadySpent}
           </p>
        </div>
      )}
    </motion.div>
  );
};
