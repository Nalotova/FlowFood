/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FoodItem, FoodCategory } from '../types/food';
import { Plus, Camera, ShoppingBag, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFridge } from '../hooks/useFridge';
import { useApp } from '../contexts/AppContext';
import { FoodItemCard } from '../components/fridge/FoodItemCard';
import { FoodItemForm } from '../components/fridge/FoodItemForm';
import { FridgeFilters } from '../components/fridge/FridgeFilters';
import { PhotoRecognitionModal } from '../components/fridge/PhotoFoodRecognitionModal';
import { PhotoRecognitionResult, RecognizedFoodDraft } from '../types/photoRecognition';
import { AiFridgeInput } from '../components/fridge/AiFridgeInput';
import { ParsedFoodDraftList } from '../components/fridge/ParsedFoodDraftList';
import { ParsedFridgeItemDraft, FridgeAiInput } from '../types/fridgeAi';
import { parseFridgeInput } from '../services/fridgeAiService';
import { recognizeFoodFromPhotos } from '../services/photoFoodRecognitionService';
import { normalizeParsedFoodDraft, normalizeRecognizedFoodDraft } from '../utils/normalizeFoodDraft';
import { i18n } from '../i18n/ru';

import { DiagnosticsPanel } from '../components/cooking/DiagnosticsPanel';

export const FridgePage: React.FC = () => {
  const { user, userAppProfile, permissions } = useApp();
  const { items, addFoodItem, updateFoodItem, deleteFoodItem, adjustAmount, setAmount, loading } = useFridge();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | Partial<RecognizedFoodDraft> | Partial<ParsedFridgeItemDraft> | undefined>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');

  const [aiDrafts, setAiDrafts] = useState<ParsedFridgeItemDraft[]>([]);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, search, selectedCategory]);

  const handleAddNew = () => {
    if (!permissions.canEdit) return;
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (item: FoodItem) => {
    if (!permissions.canEdit) return;
    setEditingItem(item);
    setEditingDraftId(null);
    setIsFormOpen(true);
  };

  const handleAiParse = async (text: string, images: string[]) => {
    if (!permissions.canEdit) return;
    setIsAiParsing(true);
    try {
      const result = await parseFridgeInput({ 
        text, 
        images,
        existingFoodItems: items.map(i => ({ id: i.id, name: i.name })) 
      });
      if (result.status === 'success' || result.status === 'partial') {
        setAiDrafts(prev => [...result.items, ...prev]);
      }
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSaveDrafts = async (draftsToSave?: ParsedFridgeItemDraft[], mergeSettings?: Record<string, boolean>) => {
    if (!permissions.canEdit) return;
    const targetDrafts = draftsToSave || aiDrafts;
    
    for (const draft of targetDrafts) {
      if (!draft.needsReview) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tempId, needsReview, nutritionConfidence, warnings, matchedExistingFoodItemId, ...itemData } = draft;
        
        const shouldMerge = matchedExistingFoodItemId && mergeSettings?.[tempId] !== false;

        if (shouldMerge && matchedExistingFoodItemId) {
          await adjustAmount(matchedExistingFoodItemId, itemData.amount || 0);
        } else {
          await addFoodItem(itemData as Omit<FoodItem, "id" | "createdAt" | "updatedAt">);
        }
      }
    }
    
    if (draftsToSave) {
      setAiDrafts(prev => prev.filter(d => !draftsToSave.find(ts => ts.tempId === d.tempId)));
    } else {
      setAiDrafts([]);
    }
  };

  const handleDeleteDraft = (tempId: string) => {
    if (!permissions.canEdit) return;
    setAiDrafts(prev => prev.filter(d => d.tempId !== tempId));
  };

  const handleEditDraft = (draft: ParsedFridgeItemDraft) => {
    if (!permissions.canEdit) return;
    // Normalize before editing to ensure no nulls in form
    setEditingItem(normalizeParsedFoodDraft(draft));
    setEditingDraftId(draft.tempId);
    setIsFormOpen(true);
  };

  const handlePhotoResult = (result: PhotoRecognitionResult) => {
    if (!permissions.canEdit) return;
    if (result.draft) {
      // Normalize and pre-fill amount based on package info
      const normalizedDraft = normalizeRecognizedFoodDraft(result.draft);
      
      if (normalizedDraft.packageAmount) {
        normalizedDraft.amount = normalizedDraft.packageAmount;
        normalizedDraft.unit = normalizedDraft.packageUnit || 'g';
      } else if (!normalizedDraft.amount) {
        normalizedDraft.amount = 1;
        normalizedDraft.unit = 'piece';
      }
      
      setEditingItem(normalizedDraft);
      setIsPhotoModalOpen(false);
      setIsFormOpen(true);
    }
  };

  const handleSave = async (itemData: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
    if (!permissions.canEdit) return;
    if (editingDraftId) {
      setAiDrafts(prev => prev.map(d => 
        d.tempId === editingDraftId 
          ? { ...d, ...itemData, needsReview: false, warnings: [] } 
          : d
      ));
      setEditingDraftId(null);
    } else if ('id' in (editingItem || {})) {
      await updateFoodItem((editingItem as FoodItem).id, itemData);
    } else {
      await addFoodItem(itemData);
    }
    setIsFormOpen(false);
    setEditingItem(undefined);
  };

  const handlePhotoAdd = () => {
    if (!permissions.canEdit) return;
    setIsPhotoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-300">
        <div className="w-10 h-10 border-4 border-dashed border-stone-200 rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">{i18n.common.loading}</span>
      </div>
    );
  }

  if (isFormOpen) {
    const itemKey = editingItem ? ('id' in editingItem ? (editingItem as FoodItem).id : (editingItem as ParsedFridgeItemDraft).tempId) : 'new';
    return (
      <FoodItemForm 
        key={itemKey}
        initialData={editingItem}
        onSave={handleSave}
        onCancel={() => setIsFormOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-24">
      <AnimatePresence>
        {isPhotoModalOpen && (
          <PhotoRecognitionModal 
            onResult={handlePhotoResult}
            onCancel={() => setIsPhotoModalOpen(false)}
            onRecognize={(images) => recognizeFoodFromPhotos({ images })}
            mode="product"
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-natural-primary">{i18n.fridge.title}</h1>
        {permissions.canEdit && (
          <div className="flex gap-2">
            <button 
              onClick={handlePhotoAdd}
              className="w-10 h-10 bg-natural-muted rounded-full flex items-center justify-center text-stone-400 border border-stone-100 hover:text-natural-primary transition-colors"
            >
              <Camera size={18} />
            </button>
            <button 
              onClick={handleAddNew}
              className="w-10 h-10 bg-natural-accent rounded-full flex items-center justify-center text-natural-primary shadow-sm hover:bg-stone-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {permissions.canEdit && (
        <AiFridgeInput 
          onParse={handleAiParse}
          onManualAdd={handleAddNew}
          isLoading={isAiParsing}
        />
      )}

      {aiDrafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pb-2"
        >
          <ParsedFoodDraftList 
            drafts={aiDrafts}
            existingItems={items}
            onEdit={handleEditDraft}
            onDelete={handleDeleteDraft}
            onSaveAll={handleSaveDrafts}
            onCancel={() => setAiDrafts([])}
          />
        </motion.div>
      )}

      <FridgeFilters 
        search={search} 
        onSearchChange={setSearch} 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
      />

      <AnimatePresence mode="popLayout">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-stone-50 border border-stone-100 rounded-[40px] flex items-center justify-center text-stone-200">
              <ShoppingBag size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-stone-800 text-xl">{i18n.fridge.noProducts}</h3>
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest px-8">
                  {i18n.fridge.noProductsHint}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                 <button 
                  onClick={handleAddNew}
                  className="px-8 py-3 bg-natural-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-natural-primary/10"
                >
                  {i18n.fridge.addProduct}
                </button>
              </div>
              
              <div className="pt-8 w-full max-w-xs mx-auto">
                 {/* Diagnostics panel moved to Settings */}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onEdit={permissions.canEdit ? handleEdit : undefined}
                onDelete={permissions.canEdit ? deleteFoodItem : undefined}
                onAdjust={permissions.canEdit ? adjustAmount : undefined}
                onSet={permissions.canEdit ? setAmount : undefined}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
