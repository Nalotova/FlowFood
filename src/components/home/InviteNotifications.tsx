/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check, X, UserPlus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const InviteNotifications: React.FC = () => {
  const { pendingInvites, acceptInvite, declineInvite } = useApp();

  if (pendingInvites.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-2">
        <Mail size={12} />
        Вас пригласили в дом
      </h3>
      <AnimatePresence>
        {pendingInvites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-natural-accent/10 border border-natural-accent/20 rounded-[28px] p-5 flex items-start gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-natural-primary shadow-sm shrink-0">
              <UserPlus size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-serif font-bold text-stone-800">{invite.householdName}</h4>
              <p className="text-[10px] text-stone-500 italic">
                Пригласил: <span className="font-bold text-stone-700">{invite.invitedByEmail}</span>
              </p>
              <p className="text-[10px] font-black uppercase text-natural-primary tracking-tighter">
                Роль: {invite.role === 'member' ? 'Участник' : 'Только просмотр'}
              </p>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log("Accepting invite:", invite.id);
                    if (typeof acceptInvite === 'function') {
                      acceptInvite(invite);
                    }
                  }}
                  className="flex-1 py-3 bg-natural-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-natural-primary/20 hover:scale-105 active:scale-95 transition-all touch-manipulation"
                >
                  <Check size={14} />
                  Принять
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Declining invite:", invite.id);
                    if (typeof declineInvite === 'function') {
                      declineInvite(invite.id);
                    }
                  }}
                  className="px-6 py-3 bg-white text-stone-400 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center border border-stone-100 hover:text-red-400 transition-colors touch-manipulation"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
