/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile } from '../../types/profile';
import { Check } from 'lucide-react';
import { i18n } from '../../i18n/ru';

interface ParticipantSelectorProps {
  profiles: UserProfile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ 
  profiles, 
  selectedIds, 
  onChange 
}) => {
  const activeProfiles = profiles.filter(p => p.isActive);

  const toggleParticipant = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(idx => idx !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">{i18n.cooking.participants}</h4>
      <div className="flex flex-wrap gap-2">
        {activeProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => toggleParticipant(profile.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl border transition-all ${
              selectedIds.includes(profile.id)
                ? 'bg-stone-800 text-white border-stone-800 shadow-md'
                : 'bg-white text-stone-600 border-stone-100 hover:bg-stone-50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              selectedIds.includes(profile.id) 
                ? 'bg-natural-accent border-natural-accent' 
                : 'border-stone-200'
            }`}>
              {selectedIds.includes(profile.id) && <Check size={10} className="text-natural-primary" strokeWidth={4} />}
            </div>
            <span className="text-xs font-bold">{profile.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
