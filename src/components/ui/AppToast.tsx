import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, Info } from 'lucide-react';

export interface AppToastProps {
  id: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose: (id: string) => void;
}

export const AppToast: React.FC<AppToastProps> = ({ id, message, variant = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColor = variant === 'success' ? 'bg-green-600' : variant === 'error' ? 'bg-red-500' : 'bg-stone-800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`rounded-[24px] shadow-xl px-5 py-4 ${bgColor} text-white flex items-center gap-3 backdrop-blur-md pointer-events-auto`}
    >
      {variant === 'success' && <Check size={18} />}
      {variant === 'error' && <X size={18} />}
      {variant === 'info' && <Info size={18} />}
      <span className="text-xs font-black uppercase tracking-widest">{message}</span>
    </motion.div>
  );
}
