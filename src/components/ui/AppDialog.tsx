import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AppDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AppDialog: React.FC<AppDialogProps> = ({
  isOpen, title, message, variant = 'info', confirmText = 'OK', cancelText = 'Отмена', showCancel = false, onConfirm, onCancel
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger': return <AlertCircle className="text-red-500" size={32} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
      case 'success': return <CheckCircle2 className="text-green-500" size={32} />;
      default: return <Info className="text-natural-primary" size={32} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" 
          onClick={showCancel ? onCancel : onConfirm}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative bg-white rounded-[40px] p-8 max-w-sm w-full mx-auto shadow-2xl flex flex-col items-center space-y-6 text-center"
        >
          <div className="flex justify-center">{getIcon()}</div>
          <div className="space-y-2">
            {title && <h3 className="text-xl font-serif font-bold text-stone-800 tracking-tight">{title}</h3>}
            <p className="text-sm text-stone-500 leading-relaxed font-medium">{message}</p>
          </div>
          <div className="flex gap-3 w-full justify-center">
            {showCancel && (
              <button onClick={onCancel} className="flex-1 py-4 bg-stone-50 text-stone-500 rounded-[20px] font-black uppercase text-[10px] tracking-widest hover:bg-stone-100 transition-colors">
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm} 
              className={`flex-1 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-lg hover:opacity-90 ${
                variant === 'danger' ? 'bg-red-500 shadow-red-500/20' : 
                variant === 'warning' ? 'bg-amber-500 shadow-amber-500/20' :
                'bg-natural-primary shadow-natural-primary/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
