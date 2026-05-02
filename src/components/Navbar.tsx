/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Refrigerator, CookingPot, History, Settings } from 'lucide-react';
import { i18n } from '../i18n/ru';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profiles', label: i18n.navigation.profiles, icon: User },
    { id: 'fridge', label: i18n.navigation.fridge, icon: Refrigerator },
    { id: 'cooking', label: i18n.navigation.cooking, icon: CookingPot },
    { id: 'history', label: i18n.navigation.history, icon: History },
    { id: 'settings', label: i18n.navigation.settings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 lg:bottom-12 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-100 px-6 py-4 flex justify-between items-center z-50 lg:rounded-b-[32px]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            id={`nav-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 transition-all outline-none ${
              isActive ? 'text-natural-primary scale-110' : 'text-stone-300 hover:text-stone-400'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[9px] font-black tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
