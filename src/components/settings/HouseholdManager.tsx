/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Mail, Shield, UserPlus, X, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../contexts/AppContext';
import { i18n } from '../../i18n/ru';
import { householdService } from '../../services/householdService';
import { HouseholdRole } from '../../types/household';

export const HouseholdManager: React.FC = () => {
  const { user, activeHousehold, userRole, permissions, refreshData } = useApp();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HouseholdRole>('member');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRepair = async () => {
    if (!user || isRepairing) return;
    setIsRepairing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!activeHousehold || !confirm('Вы уверены, что хотите удалить этого участника?')) return;
    try {
      await householdService.removeMemberFromHousehold(activeHousehold.id, memberUserId);
      await refreshData();
    } catch (err: any) {
      alert(err.message || i18n.common.error);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHousehold || !user || isSending) return;

    setIsSending(true);
    try {
      await householdService.inviteUserToHousehold({
        householdId: activeHousehold.id,
        householdName: activeHousehold.name,
        invitedEmail: inviteEmail,
        invitedByUserId: user.uid,
        invitedByEmail: user.email || '',
        role: inviteRole as "member" | "viewer"
      });
      
      setSuccessMessage(i18n.household.inviteSuccess);
      setInviteEmail('');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || i18n.common.error);
    } finally {
      setIsSending(false);
    }
  };

  if (!activeHousehold) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-natural-muted rounded-2xl flex items-center justify-center text-natural-primary">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-800">{i18n.household.title}</h2>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              {activeHousehold.name}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-stone-100 rounded-full">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
            {i18n.household.roles[userRole]}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-stone-100 p-6 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={12} />
              {i18n.household.members} ({activeHousehold.members?.length || 0})
            </h3>
            {permissions.canInvite && (
              <button 
                type="button"
                onClick={() => {
                  console.log("Opening invite modal");
                  setIsInviteModalOpen(true);
                }}
                className="text-[10px] font-black text-natural-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity p-2 -m-2 touch-manipulation"
              >
                <UserPlus size={14} />
                {i18n.household.inviteMember}
              </button>
            )}
          </div>

          <div className="divide-y divide-stone-50">
            {activeHousehold.members && activeHousehold.members.length > 0 ? (
              activeHousehold.members.map((member) => (
                <div key={member.userId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 font-bold text-xs">
                      {member.displayName?.charAt(0) || member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{member.displayName || 'Пользователь'}</p>
                      <p className="text-[10px] text-stone-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                        member.role === 'owner' ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-400'
                      }`}>
                        {i18n.household.roles[member.role] || member.role}
                      </span>
                      {member.userId === user?.uid && (
                        <p className="text-[8px] text-stone-300 font-bold uppercase mt-0.5">Вы</p>
                      )}
                    </div>
                    {permissions.canManage && member.role !== 'owner' && member.userId !== user?.uid && (
                      <button 
                        type="button"
                        onClick={() => {
                          console.log("Removing member:", member.userId);
                          handleRemoveMember(member.userId);
                        }}
                        className="p-3 -m-1 text-stone-300 hover:text-red-400 transition-colors touch-manipulation"
                        title={i18n.common.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center space-y-4">
                <p className="text-xs text-stone-400 italic">Список участников пуст</p>
                {userRole === 'owner' && (
                   <button 
                    onClick={handleRepair}
                    disabled={isRepairing}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-500 hover:bg-stone-200 transition-all"
                  >
                    <Clock size={14} className={isRepairing ? 'animate-spin' : ''} />
                    {isRepairing ? 'Восстановление...' : 'Восстановить список'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!permissions.canInvite && (
          <p className="text-[9px] text-stone-400 italic text-center border-t border-stone-50 pt-4">
            {i18n.household.ownerOnlyAction}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-800 transition-colors"
                disabled={isSending}
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-natural-muted rounded-[24px] flex items-center justify-center text-natural-primary mx-auto mb-2">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-xl font-serif font-black text-stone-800">{i18n.household.inviteMember}</h3>
                  <p className="text-xs text-stone-400 px-4">{i18n.household.inviteRole}</p>
                </div>

                {successMessage ? (
                  <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-sm font-bold text-stone-700 leading-relaxed px-4">{successMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendInvite} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 italic">
                        Email участника
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          autoFocus
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder={i18n.household.inviteEmailPlaceholder}
                          className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-natural-primary/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 italic">
                        {i18n.household.inviteRole}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['member', 'viewer'] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setInviteRole(role)}
                            className={`py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                              inviteRole === role 
                                ? 'bg-natural-muted border-natural-primary text-natural-primary' 
                                : 'bg-white border-stone-100 text-stone-400'
                            }`}
                          >
                            {i18n.household.roles[role]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || !inviteEmail}
                      className={`w-full py-5 rounded-[28px] font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                        isSending 
                          ? 'bg-stone-100 text-stone-400' 
                          : 'bg-natural-primary text-white shadow-stone-200 active:scale-95'
                      }`}
                    >
                      {isSending ? i18n.common.loading : i18n.household.sendInvite}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
