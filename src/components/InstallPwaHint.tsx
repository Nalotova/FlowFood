/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, X } from 'lucide-react';
import { i18n } from '../i18n/ru';

export const InstallPwaHint: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only on mobile, if not in standalone, and not dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isDismissed = localStorage.getItem('pwa_hint_dismissed');

    if (isMobile && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 10000); // Show after 10s
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (permanent = false) => {
    setIsVisible(false);
    if (permanent) {
      localStorage.setItem('pwa_hint_dismissed', 'true');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-4 right-4 z-[100] sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <div className="bg-natural-primary text-white p-6 rounded-[32px] shadow-2xl space-y-4 border border-white/10 backdrop-blur-xl">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <button onClick={() => handleDismiss()} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-lg leading-tight">{i18n.pwa.installPrompt}</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {i18n.pwa.installInstructions}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDismiss(true)}
                className="flex-1 py-3 bg-white text-natural-primary rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                {i18n.pwa.gotIt}
              </button>
              <button
                onClick={() => handleDismiss()}
                className="px-4 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                {i18n.pwa.notNow}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
