import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ParsedFridgeItemDraft } from '../../types/fridgeAi';
import { FoodItem } from '../../types/food';
import { ParsedFoodDraftCard } from './ParsedFoodDraftCard';
import { Check, X, Save, AlertCircle } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface ParsedFoodDraftListProps {
  drafts: ParsedFridgeItemDraft[];
  existingItems: FoodItem[];
  onEdit?: (draft: ParsedFridgeItemDraft) => void;
  onDelete?: (tempId: string) => void;
  onSaveAll?: (drafts?: ParsedFridgeItemDraft[], mergeSettings?: Record<string, boolean>) => void;
  onCancel?: () => void;
}

export const ParsedFoodDraftList: React.FC<ParsedFoodDraftListProps> = ({
  drafts,
  existingItems,
  onEdit,
  onDelete,
  onSaveAll,
  onCancel
}) => {
  // Map of tempId -> shouldMerge
  const [mergeSettings, setMergeSettings] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    drafts.forEach(d => {
      if (d.matchedExistingFoodItemId) initial[d.tempId] = true;
    });
    return initial;
  });

  const canSaveAll = drafts.every(d => !d.needsReview);

  const checkIfDuplicate = (draft: ParsedFridgeItemDraft) => {
    if (draft.matchedExistingFoodItemId) return true;
    return existingItems.some(item => item.name.toLowerCase() === draft.name.toLowerCase());
  };

  const toggleMerge = (tempId: string) => {
    setMergeSettings(prev => ({
      ...prev,
      [tempId]: !prev[tempId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          {i18n.fridge.draftsTitle} ({drafts.length})
        </h3>
        <button onClick={onCancel} className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-red-400 transition-colors">
          {i18n.common.cancel}
        </button>
      </div>

      <div className="space-y-4">
        {drafts.map((draft) => (
          <ParsedFoodDraftCard
            key={draft.tempId}
            draft={draft}
            onEdit={typeof onEdit === 'function' ? () => onEdit(draft) : undefined}
            onDelete={typeof onDelete === 'function' ? () => onDelete(draft.tempId) : undefined}
            isExisting={checkIfDuplicate(draft)}
            shouldMerge={!!mergeSettings[draft.tempId]}
            onToggleMerge={() => toggleMerge(draft.tempId)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-[32px] font-black uppercase tracking-widest text-[10px] hover:bg-stone-200 transition-colors"
        >
          {i18n.common.cancel}
        </button>
        <button
          onClick={() => onSaveAll?.(drafts, mergeSettings)}
          disabled={!canSaveAll || drafts.length === 0}
          className={`flex-[2] py-4 rounded-[32px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
            canSaveAll && drafts.length > 0
              ? 'bg-natural-primary text-white shadow-lg shadow-natural-primary/20 active:scale-95'
              : 'bg-stone-100 text-stone-300'
          }`}
        >
          <Save size={14} />
          {i18n.fridge.saveAll}
        </button>
      </div>
      
      {!canSaveAll && (
        <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-amber-500 uppercase tracking-tight">
          <AlertCircle size={12} />
          <span>{i18n.fridge.checkData}</span>
        </div>
      )}
    </div>
  );
};
