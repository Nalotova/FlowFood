/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History as HistoryIcon, Clock, Trash2, User, Plus, ChefHat, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFoodLog } from '../hooks/useFoodLog';
import { useFridge } from '../hooks/useFridge';
import { useProfiles } from '../hooks/useProfiles';
import { i18n } from '../i18n/ru';
import { QuickSnackForm } from '../components/foodLog/QuickSnackForm';
import { PhotoRecognitionModal } from '../components/fridge/PhotoFoodRecognitionModal';
import { cookingHistoryService } from '../services/cookingHistoryService';
import { estimateFoodFromPhotos, FoodEstimationResult } from '../services/photoFoodEstimationService';
import { RecipeDetailModal } from '../components/cooking/RecipeDetailModal';
import { useApp } from '../contexts/AppContext';
import { CookingResult } from '../types/cooking';
import { DailyNutritionDashboard } from '../components/foodLog/DailyNutritionDashboard';
import { DailyAiNutritionCoach } from '../components/foodLog/DailyAiNutritionCoach';
import { FoodLogEntryCard } from '../components/foodLog/FoodLogEntryCard';

export const HistoryPage: React.FC = () => {
  const { activeHousehold, permissions, userRole } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | 'all'>('all');
  
  const { entries, deleteEntry, addEntry, loading: logLoading } = useFoodLog(selectedDate);
  const { items, setAmount } = useFridge();
  const { profiles } = useProfiles();
  const [isSnackOpen, setIsSnackOpen] = useState(false);

  // Auto-select single profile
  React.useEffect(() => {
    if (profiles.length === 1 && selectedProfileId === 'all') {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [estimationResult, setEstimationResult] = useState<FoodEstimationResult | null>(null);
  const [view, setView] = useState<'log' | 'cooking'>('log');
  const [cookingHistory, setCookingHistory] = useState<CookingResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CookingResult | null>(null);

  const householdId = activeHousehold?.id;

  const fetchCookingHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    const history = await cookingHistoryService.getHistory(householdId);
    setCookingHistory(history);
    setHistoryLoading(false);
  }, [householdId]);

  React.useEffect(() => {
    if (view === 'cooking') {
      fetchCookingHistory();
    }
  }, [view, fetchCookingHistory]);

  const filteredEntries = entries.filter(entry => 
    (selectedProfileId === 'all' || entry.profileId === selectedProfileId)
  );

  const sortedEntries = [...filteredEntries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeProfile = profiles.find(p => p.id === selectedProfileId);

  if (logLoading || (view === 'cooking' && historyLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-300">
        <div className="w-10 h-10 border-4 border-dashed border-stone-200 rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">{i18n.common.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-32">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <h1 className="text-3xl font-serif font-bold text-natural-primary">{i18n.navigation.history}</h1>
            <div className="flex bg-stone-100 p-1 rounded-2xl w-fit">
              <button 
                onClick={() => setView('log')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'log' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
                }`}
              >
                Дневник
              </button>
              <button 
                onClick={() => setView('cooking')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'cooking' ? 'bg-white text-natural-primary shadow-sm' : 'text-stone-400'
                }`}
              >
                Рецепты
              </button>
            </div>
          </div>

          {view === 'log' && permissions.canEdit && (
            <button 
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center space-x-2 bg-white px-4 py-3 rounded-full text-stone-600 border border-stone-100 hover:text-natural-primary transition-colors active:scale-95 shadow-sm"
              title="Добавить по фото"
            >
              <Camera size={18} />
            </button>
          )}
        </div>

        {(view === 'log' && (permissions.canEdit || userRole === 'owner')) && (
          <button 
            onClick={() => {
              setEstimationResult(null);
              setIsSnackOpen(true);
            }}
            className="w-full flex items-center justify-center space-x-3 bg-natural-primary py-5 rounded-[24px] text-white hover:bg-natural-primary/90 transition-all active:scale-95 shadow-lg shadow-natural-primary/10"
          >
            <Plus size={20} />
            <span className="text-sm font-black uppercase tracking-widest">{i18n.foodLog.addUnplanned}</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isPhotoModalOpen && (
          <PhotoRecognitionModal<FoodEstimationResult>
            onResult={(res) => {
              setEstimationResult(res);
              setIsPhotoModalOpen(false);
              setIsSnackOpen(true);
            }}
            onCancel={() => setIsPhotoModalOpen(false)}
            onRecognize={(images) => estimateFoodFromPhotos({ images })}
            mode="food"
            title="Оценить еду по фото"
          />
        )}

        {isSnackOpen && (
          <QuickSnackForm 
            profiles={profiles}
            foodItems={items}
            initialData={estimationResult ? {
              foodName: estimationResult.foodName,
              kcal: estimationResult.kcal,
              protein: estimationResult.protein,
              fat: estimationResult.fat,
              carbs: estimationResult.carbs,
              notes: estimationResult.notes
            } : undefined}
            onCancel={() => {
              setIsSnackOpen(false);
              setEstimationResult(null);
            }}
            onSave={async (entry) => {
              await addEntry(entry);
              if (entry.subtractFromFridge && entry.foodItemId) {
                const food = items.find(f => f.id === entry.foodItemId);
                if (food) {
                  await setAmount(entry.foodItemId, Math.max(0, food.amount - entry.amount));
                }
              }
              setIsSnackOpen(false);
              setEstimationResult(null);
            }}
          />
        )}

        {selectedResult && (
          <RecipeDetailModal 
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="popLayout">
        {view === 'log' ? (
          <div className="space-y-6">
            <DailyNutritionDashboard 
              entries={entries}
              profiles={profiles}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedProfileId={selectedProfileId}
              onProfileChange={setSelectedProfileId}
            />

            {activeProfile && (
              <DailyAiNutritionCoach 
                profile={activeProfile}
                entries={filteredEntries}
                fridgeItems={items}
              />
            )}

            {sortedEntries.length === 0 ? (
              <motion.div 
                key="empty-log"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center text-stone-200">
                  <HistoryIcon size={48} strokeWidth={1.5} />
                </div>
                <div className="space-y-4 px-8">
                  <h3 className="font-serif font-bold text-stone-800 text-xl">{i18n.history.emptyTitle}</h3>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest leading-relaxed">{i18n.history.emptyText}</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {sortedEntries.map((entry) => (
                  <FoodLogEntryCard 
                    key={entry.id}
                    entry={entry}
                    canEdit={permissions.canEdit}
                    onDelete={() => deleteEntry(entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          cookingHistory.length === 0 ? (
            <motion.div 
               key="empty-cooking"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center py-24 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center text-stone-200">
                <ChefHat size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-4 px-8">
                <h3 className="font-serif font-bold text-stone-800 text-xl">Нет рецептов</h3>
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest leading-relaxed">Приготовленные блюда появятся здесь</p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {cookingHistory.map((res) => (
                <motion.div 
                  key={res.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedResult(res)}
                  className="bg-white p-5 rounded-[32px] border border-stone-100 shadow-sm space-y-3 cursor-pointer hover:border-natural-primary/20 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                       <div className="w-8 h-8 rounded-xl bg-natural-accent flex items-center justify-center text-lg">👩‍🍳</div>
                       <div>
                         <h4 className="font-bold text-stone-800 text-sm">{res.mealName}</h4>
                         <p className="text-[9px] text-stone-300 font-bold uppercase tracking-widest">
                           {new Date(res.createdAt).toLocaleDateString('ru-RU')}
                         </p>
                       </div>
                    </div>
                    {permissions.canEdit && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`${i18n.common.delete}?`)) {
                            await cookingHistoryService.deleteResult(res.id, householdId);
                            fetchCookingHistory();
                          }
                        }}
                        className="p-2 text-stone-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {res.portions.map(p => (
                      <span key={p.profileId} className="text-[8px] font-black uppercase text-stone-400 border border-stone-100 px-2 py-1 rounded-lg">
                        {p.profileName}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
