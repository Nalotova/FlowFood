/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ProfilesPage } from './pages/ProfilesPage';
import { FridgePage } from './pages/FridgePage';
import { CookingPage } from './pages/CookingPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navbar } from './components/Navbar';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from './contexts/AppContext';
import { LoginPage } from './pages/LoginPage';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('profiles');
  const { user, loading, error } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-natural-primary" size={32} />
        <p className="text-xs font-black text-stone-400 uppercase tracking-widest italic">Загрузка кухни...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-stone-800">Ошибка загрузки</h2>
          <p className="text-sm text-stone-500 leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profiles':
        return <ProfilesPage />;
      case 'fridge':
        return <FridgePage />;
      case 'cooking':
        return <CookingPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ProfilesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg">
      {/* Decorative Sidebar for Desktop (visible only on large screens) */}
      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 max-w-sm">
        <div className="text-xs font-bold text-natural-primary uppercase tracking-[0.2em] mb-2">Проект MVP</div>
        <h2 className="text-5xl font-serif text-stone-800 mb-6 leading-tight">Семейный<br/>Холодильник</h2>
        <p className="text-stone-500 leading-relaxed mb-8">
          Семейное приложение для оптимизации питания и учета продуктов. Мобильное приложение специально для кухни.
        </p>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">01</div>
            <div>
              <h4 className="font-bold text-stone-800 text-sm">Учет профилей</h4>
              <p className="text-xs text-stone-400">Индивидуальные КБЖУ для всей семьи.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">02</div>
            <div>
              <h4 className="font-bold text-stone-800 text-sm">Умная готовка</h4>
              <p className="text-xs text-stone-400">AI-расчет порций на основе остатков продуктов.</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-x-hidden relative flex flex-col pt-8 pb-24 lg:rounded-[40px] lg:my-8 lg:min-h-[85vh] lg:border-[8px] lg:border-stone-800">
        <div className="px-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Home Indicator (Mobile style) */}
        <div className="h-1.5 w-24 bg-stone-100 rounded-full mx-auto mb-4 mt-auto" />
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
