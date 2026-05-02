import React, { useState } from 'react';
import { Edit2, Trash2, AlertCircle, Info, ChevronDown, ChevronUp, Database, Sparkles, Plus, Combine } from 'lucide-react';
import { ParsedFridgeItemDraft } from '../../types/fridgeAi';
import { motion, AnimatePresence } from 'motion/react';
import { i18n } from '../../i18n/ru';
import { formatNutritionValue } from '../../utils/nutrition';

interface ParsedFoodDraftCardProps {
  draft: ParsedFridgeItemDraft;
  onEdit: () => void;
  onDelete: () => void;
  isExisting: boolean;
  shouldMerge: boolean;
  onToggleMerge: () => void;
}

export const ParsedFoodDraftCard: React.FC<ParsedFoodDraftCardProps> = ({ 
  draft, 
  onEdit, 
  onDelete,
  isExisting,
  shouldMerge,
  onToggleMerge
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryLabel = (cat: string) => {
    return i18n.fridge.categories[cat as keyof typeof i18n.fridge.categories] || cat;
  };

  const getUnitLabel = (unit: string) => {
    if (!unit) return '';
    return i18n.fridge.units[unit as keyof typeof i18n.fridge.units] || unit;
  };

  const getSourceLabel = (source: string) => {
    return i18n.fridge.sources[source as keyof typeof i18n.fridge.sources] || source;
  };

  return (
    <div className={`bg-white rounded-[32px] border transition-all ${
      draft.needsReview ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-stone-100 shadow-sm'
    } p-4`}>
       <div className="flex justify-between items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-stone-800 text-sm truncate">{draft.name}</h4>
             {draft.needsReview && <AlertCircle size={10} className="text-amber-500 shrink-0" />}
          </div>
          <p className="text-[10px] font-black text-natural-primary uppercase tracking-widest mt-0.5">
            {draft.amount ? `${draft.amount} ${getUnitLabel(draft.unit || '')}` : 'Количество не указано'}
          </p>
          {draft.brand && <p className="text-[9px] font-bold text-stone-400 truncate">{draft.brand}</p>}
        </div>
        
        <div className="flex gap-1 shrink-0">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-natural-primary text-white' : 'bg-stone-50 text-stone-400'}`}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onEdit} className="p-2 text-stone-300 hover:text-natural-primary transition-colors bg-stone-50 rounded-xl">
            <Edit2 size={14} />
          </button>
          <button 
            type="button"
            onClick={onDelete} 
            className="p-2 text-stone-300 hover:text-red-500 transition-colors bg-stone-50 rounded-xl"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Nutrition */}
              <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">КБЖУ / 100г</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                    draft.nutritionConfidence === 'high' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {draft.nutritionConfidence === 'high' ? 'Точные данные' : 'Примерные данные'}
                  </span>
                </div>
                <div className="text-xs font-black text-stone-700 mb-2">{draft.kcalPer100g || 0} {i18n.common.kcalAbbr}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-600">{formatNutritionValue(draft.proteinPer100g)}</div>
                    <div className="text-[8px] font-black text-stone-300 uppercase">{i18n.common.proteinsAbbr}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-600">{formatNutritionValue(draft.fatPer100g)}</div>
                    <div className="text-[8px] font-black text-stone-300 uppercase">{i18n.common.fatsAbbr}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-600">{formatNutritionValue(draft.carbsPer100g)}</div>
                    <div className="text-[8px] font-black text-stone-300 uppercase">{i18n.common.carbsAbbr}</div>
                  </div>
                </div>
              </div>

              {/* Source & Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50/50 p-2 rounded-xl text-[9px] font-bold text-stone-500 flex items-center gap-2">
                  <Database size={10} />
                  <span>{getSourceLabel(draft.source)}</span>
                </div>
                <div className="bg-stone-50/50 p-2 rounded-xl text-[9px] font-bold text-stone-500 flex items-center gap-2">
                  <Sparkles size={10} className="text-natural-primary" />
                  <span>Уверенность: {Math.round(draft.confidenceScore * 100)}%</span>
                </div>
              </div>

              {draft.notes && (
                <div className="text-[10px] font-medium text-stone-400 italic bg-stone-50 p-2 rounded-xl">
                  {draft.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(draft.warnings.length > 0 || isExisting) && (
        <div className="mt-3 space-y-2">
          {isExisting && (
            <div className="bg-natural-primary/5 p-2 rounded-2xl flex flex-col gap-2">
               <div className="flex items-center gap-2 text-[8px] font-black text-natural-primary uppercase tracking-tight">
                <Info size={10} />
                {i18n.fridge.duplicateWarning}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={onToggleMerge}
                  className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                    shouldMerge ? 'bg-natural-primary text-white shadow-sm' : 'bg-white text-stone-400 border border-stone-100'
                  }`}
                >
                  <Combine size={10} />
                  {i18n.fridge.mergeWithExisting}
                </button>
                <button 
                  onClick={onToggleMerge}
                  className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                    !shouldMerge ? 'bg-natural-primary text-white shadow-sm' : 'bg-white text-stone-400 border border-stone-100'
                  }`}
                >
                  <Plus size={10} />
                  {i18n.fridge.createNew}
                </button>
              </div>
            </div>
          )}
          {draft.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[8px] font-bold text-amber-600 uppercase tracking-tight bg-amber-50/50 p-1.5 rounded-lg">
              <AlertCircle size={10} />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
