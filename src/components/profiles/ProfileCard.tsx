/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile } from '../../types/profile';
import { Settings2, Trash2, Power, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatProteinTarget } from '../../utils/nutrition';

import { i18n } from '../../i18n/ru';

interface ProfileCardProps {
  profile: UserProfile;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onEdit, 
  onDelete, 
  onToggleActive 
}) => {
  const sumMealKcal = (profile.mealDistribution.breakfast || 0) + 
                     (profile.mealDistribution.lunch || 0) + 
                     (profile.mealDistribution.snack || 0) + 
                     (profile.mealDistribution.dinner || 0);
  
  const kcalDiff = Math.abs(sumMealKcal - (profile.dailyKcal || 0));
  const hasWarning = profile.dailyKcal && kcalDiff > 150;

  const getRoleLabel = (role: string) => {
    return i18n.profiles.roles[role as keyof typeof i18n.profiles.roles] || role;
  };

  const getGenderLabel = (gender: string) => {
    return i18n.profiles.genders[gender as keyof typeof i18n.profiles.genders] || gender;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 rounded-[32px] border shadow-sm flex flex-col space-y-4 hover:shadow-md transition-all ${
        profile.isActive ? 'border-stone-100' : 'border-stone-200 grayscale opacity-60'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-natural-primary text-xl font-serif font-bold border border-stone-200">
          {profile.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-stone-800">{profile.name}</h3>
            {!profile.isActive && (
              <span className="text-[8px] font-black bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded uppercase">{i18n.profiles.inactive}</span>
            )}
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            {getRoleLabel(profile.role)} • {profile.age || '?'} л.
            {profile.gender && profile.gender !== 'not_specified' && (
              <> • {getGenderLabel(profile.gender)}</>
            )}
          </p>
        </div>
        <div className="flex space-x-1">
           <button 
            onClick={() => onToggleActive(profile.id)}
            className={`p-2 rounded-full transition-colors ${profile.isActive ? 'text-green-500 hover:bg-green-50' : 'text-stone-300 hover:bg-stone-100'}`}
          >
            <Power size={18} />
          </button>
          <button 
            onClick={() => onEdit(profile)}
            className="p-2 text-stone-300 hover:text-natural-primary hover:bg-stone-50 rounded-full transition-colors"
          >
            <Settings2 size={18} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`${i18n.common.delete} ${profile.name}?`)) onDelete(profile.id);
            }}
            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
          <div className="text-[8px] font-black text-stone-400 uppercase mb-1">{i18n.profiles.dailyTarget}</div>
          <div className="text-sm font-serif font-black text-natural-primary mt-1">{profile.dailyKcal || 0} {i18n.common.kcalAbbr}</div>
        </div>
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex flex-col justify-between">
          <div>
            <div className="text-[8px] font-black text-stone-400 uppercase mb-1">Белок</div>
            <div className="text-[10px] font-bold text-stone-700 leading-tight">
              {formatProteinTarget(profile)}
            </div>
          </div>
          <div className="text-[8px] font-black text-stone-400 uppercase mt-2 mb-1">Распределение</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-[9px] font-bold text-stone-400">З: {profile.mealDistribution.breakfast}</div>
            <div className="text-[9px] font-bold text-stone-400">О: {profile.mealDistribution.lunch}</div>
            <div className="text-[9px] font-bold text-stone-400">П: {profile.mealDistribution.snack}</div>
            <div className="text-[9px] font-bold text-stone-400">У: {profile.mealDistribution.dinner}</div>
          </div>
        </div>
      </div>

      {(profile.preferences.length > 0 || profile.dislikedFoods.length > 0 || profile.allergies.length > 0) && (
        <div className="space-y-2">
          {profile.allergies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase">Аллергия</span>
              {profile.allergies.slice(0, 3).map(a => (
                <span key={a} className="text-[9px] font-bold bg-white text-red-400 px-2 py-0.5 rounded-lg border border-red-50">{a}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {profile.preferences.slice(0, 3).map(p => (
              <span key={p} className="text-[9px] font-bold bg-natural-muted text-stone-500 px-2 py-0.5 rounded-lg border border-stone-100">{p}</span>
            ))}
          </div>
        </div>
      )}

      {hasWarning && (
        <div className="flex items-center space-x-2 text-[9px] font-bold text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-100">
          <AlertCircle size={12} />
          <span>Сумма Ккал ({sumMealKcal}) не совпадает с нормой ({profile.dailyKcal})</span>
        </div>
      )}
    </motion.div>
  );
};
