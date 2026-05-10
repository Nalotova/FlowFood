/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, error, loading } = useApp();

  return (
    <div className="min-h-screen flex items-center justify-center bg-natural-bg px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[48px] p-10 shadow-xl border border-stone-100 text-center space-y-8"
      >
        <div className="w-20 h-20 bg-natural-primary/10 rounded-3xl flex items-center justify-center mx-auto overflow-hidden">
          <img src="/logo.svg" alt="FlowFood" className="w-full h-full object-cover" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-serif text-stone-800 tracking-tight">FlowFood</h1>
          <p className="text-sm text-stone-400 leading-relaxed px-4">
            Дневник питания, БЖУ и ИИ-повар на каждый день.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest p-3 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          id="google-login-btn"
          className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white rounded-2xl p-4 font-bold text-sm hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-wait"
        >
          <LogIn size={20} />
          {loading ? 'Загрузка...' : 'Войти через Google'}
        </button>

        <div className="pt-4">
          <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em] leading-loose">
            Еда в балансе.<br/>
            Без хаоса и унылой диеты.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
