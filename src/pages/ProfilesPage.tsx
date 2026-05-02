/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types/profile';
import { Plus, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfiles } from '../hooks/useProfiles';
import { ProfileCard } from '../components/profiles/ProfileCard';
import { ProfileForm } from '../components/profiles/ProfileForm';
import { i18n } from '../i18n/ru';

export const ProfilesPage: React.FC = () => {
  const { profiles, addProfile, updateProfile, deleteProfile, toggleActive, loading } = useProfiles();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | undefined>();

  const handleCreateNew = () => {
    setEditingProfile(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleSave = async (profile: UserProfile) => {
    if (editingProfile) {
      await updateProfile(profile);
    } else {
      await addProfile(profile);
    }
    setIsFormOpen(false);
    setEditingProfile(undefined);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-300">
        <div className="w-10 h-10 border-4 border-dashed border-stone-200 rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">{i18n.common.loading}</span>
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <ProfileForm 
        initialData={editingProfile}
        onSave={handleSave}
        onCancel={() => setIsFormOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-natural-primary">{i18n.profiles.title}</h1>
        <button 
          onClick={handleCreateNew}
          className="w-10 h-10 bg-natural-accent rounded-full flex items-center justify-center text-natural-primary shadow-sm hover:bg-stone-200 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-stone-50 border border-stone-100 rounded-full flex items-center justify-center text-stone-200">
              <UserPlus size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-stone-800 text-xl">Семья пуста</h3>
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest px-8">{i18n.profiles.noProfiles}</p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="px-8 py-3 bg-natural-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-stone-100"
              >
                {i18n.profiles.addProfile}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={handleEdit}
                onDelete={deleteProfile}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
