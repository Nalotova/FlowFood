/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { LogOut, CloudUpload, User, ShieldCheck, CheckCircle2, AlertCircle, Loader2, UserPlus, Users, Trash2, Shield, Settings2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { i18n } from '../i18n/ru';
import { DiagnosticsPanel } from '../components/cooking/DiagnosticsPanel';
import { profileServiceLocal } from '../services/profileService.local';
import { fridgeServiceLocal } from '../services/fridgeService.local';
import { foodLogServiceLocal } from '../services/foodLogService.local';
import { cookingHistoryService } from '../services/cookingHistoryService';

import { profileService } from '../services/profileService';
import { fridgeService } from '../services/fridgeService';
import { foodLogService } from '../services/foodLogService';
import { householdService } from '../services/householdService';
import { HouseholdManager } from '../components/settings/HouseholdManager';

export const SettingsPage: React.FC = () => {
  const { user, signOut, activeHousehold, userAppProfile, permissions, refreshData, switchHousehold } = useApp();
  const [migrating, setMigrating] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrationStats, setMigrationStats] = useState({
    profiles: 0,
    items: 0,
    logs: 0
  });

  useEffect(() => {
    const checkLocalData = async () => {
      const profiles = await profileServiceLocal.getProfiles();
      const items = await fridgeServiceLocal.getFoodItems();
      const logs = await foodLogServiceLocal.getFoodLogEntries();
      
      setHasLocalData(profiles.length > 0 || items.length > 0 || logs.length > 0);
      setMigrationStats({
        profiles: profiles.length,
        items: items.length,
        logs: logs.length
      });
    };
    checkLocalData();
  }, []);

  const handleMigrate = async () => {
    if (!activeHousehold || migrating) return;
    
    try {
      setMigrating(true);
      const householdId = activeHousehold.id;

      // 1. Profiles
      const localProfiles = await profileServiceLocal.getProfiles();
      for (const p of localProfiles) {
        await profileService.createProfile(p, householdId);
      }

      // 2. Fridge
      const localItems = await fridgeServiceLocal.getFoodItems();
      for (const item of localItems) {
        await fridgeService.createFoodItem(item, householdId);
      }

      // 3. Logs
      const localLogs = await foodLogServiceLocal.getFoodLogEntries();
      for (const log of localLogs) {
        await foodLogService.createFoodLogEntry(log, householdId);
      }

      // Mark migrated in local storage
      localStorage.setItem('fvf_migrated', 'true');
      setHasLocalData(false);
      await refreshData();
      alert('Миграция успешно завершена!');
    } catch (err) {
      console.error("Migration failed:", err);
      alert('Ошибка при миграции');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-8 pt-2 pb-24">
      <h1 className="text-3xl font-serif font-bold text-natural-primary">{i18n.navigation.settings}</h1>

      {/* User Card */}
      <div className="bg-stone-50 rounded-[32px] p-6 border border-stone-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-natural-primary/10 rounded-2xl flex items-center justify-center text-natural-primary shadow-sm border border-natural-primary/5">
          {user?.photoURL ? (
            <img referrerPolicy="no-referrer" src={user.photoURL} alt="User" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <User size={32} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-800 truncate">{user?.displayName || 'Пользователь'}</h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{user?.email}</p>
        </div>
        <button 
          onClick={signOut}
          className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-100 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Household Selector (if multi-household) */}
      {userAppProfile && userAppProfile.householdIds.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Переключить дом</h4>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
            {userAppProfile.householdIds.map((hid) => (
              <button
                key={hid}
                onClick={() => switchHousehold(hid)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  hid === activeHousehold?.id 
                    ? 'bg-natural-primary text-white border-natural-primary shadow-lg shadow-natural-primary/20' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                }`}
              >
                Дом {hid.slice(-4).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Household Management */}
      <HouseholdManager />

      {/* Migration Card */}
      {hasLocalData && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Миграция данных</h4>
          <div className="bg-white rounded-[32px] p-6 border-2 border-dashed border-stone-100 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-natural-accent rounded-2xl flex items-center justify-center text-natural-primary">
                <CloudUpload size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-stone-800 mb-1">Перенести данные в облако</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  У вас есть данные, хранящиеся локально ({migrationStats.profiles} проф., {migrationStats.items} прод.). Перенесите их в свой аккаунт.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {migrating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Переносим...
                  </>
                ) : (
                  'Перенести всё в облако'
                )}
              </button>
              <button 
                onClick={() => setHasLocalData(false)}
                className="text-[9px] text-stone-300 font-bold uppercase tracking-widest"
              >
                Пропустить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      <div className="bg-stone-50/50 rounded-[32px] p-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-green-500">
           <CheckCircle2 size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Синхронизация активна</span>
        </div>
        <p className="text-[9px] text-stone-300 font-bold italic">Все изменения мгновенно сохраняются в Firestore</p>
      </div>

      <DiagnosticsPanel />

      {/* Debug Info for Role (Temporary) */}
      <div className="mt-8 p-4 bg-stone-900 rounded-3xl text-[10px] font-mono text-stone-500 space-y-1">
        <p className="text-stone-300 font-bold mb-2 uppercase tracking-widest">Диагностика роли</p>
        <p>User UID: {user?.uid}</p>
        <p>Household ID: {activeHousehold?.id}</p>
        <p>Owner UID: {activeHousehold?.ownerUserId}</p>
        <p>Computed Role: {permissions.canInvite ? 'Owner/Admin' : 'Viewer/Member'}</p>
        <p>Actual Role: {(() => {
          if (activeHousehold?.ownerUserId === user?.uid) return 'owner (by ID match)';
          return activeHousehold?.members?.find(m => m.userId === user?.uid)?.role || 'viewer (fallback)';
        })()}</p>
        <p>Members Length: {activeHousehold?.members?.length || 0}</p>
        <p>Is Owner By ID: {user?.uid && activeHousehold?.ownerUserId && user.uid === activeHousehold.ownerUserId ? 'YES' : 'NO'}</p>
      </div>
    </div>
  );
};
