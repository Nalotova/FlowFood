import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, User, Database, AlertTriangle } from 'lucide-react';

export const DiagnosticsPanel: React.FC = () => {
  const { user, userAppProfile, activeHousehold, loading, error } = useApp();

  if (!user && !loading) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold">
        Вы не авторизованы. Пожалуйста, войдите в аккаунт.
      </div>
    );
  }

  return (
    <div className="bg-stone-50 rounded-[32px] p-6 border border-stone-100 space-y-4">
      <div className="flex items-center gap-2 text-stone-400">
        <Shield size={14} />
        <h4 className="text-[10px] font-black uppercase tracking-widest">Диагностика связи</h4>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-100">
          <div className="flex items-center gap-2">
            <User size={12} className="text-stone-300" />
            <span className="text-[10px] font-bold text-stone-500">ID Пользователя</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">{user?.uid?.substring(0, 8)}...</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-100">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-stone-300" />
            <span className="text-[10px] font-bold text-stone-500">Дом (Household)</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">{activeHousehold?.id || 'Не загружен'}</span>
        </div>

        {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100">
                <AlertTriangle size={12} />
                <span className="text-[10px] font-black uppercase">{error}</span>
            </div>
        )}
      </div>

      <p className="text-[9px] text-stone-300 leading-relaxed italic">
        Если ID дома на телефоне и в превью отличаются, значит вы используете разные пространства. 
        Убедитесь, что вы вошли в один и тот же Google аккаунт.
      </p>
    </div>
  );
};
