import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AppDialog, AppDialogProps } from '../components/ui/AppDialog';
import { AppToast, AppToastProps } from '../components/ui/AppToast';

interface ToastData {
  id: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
}

interface DialogData extends Omit<AppDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'> {
  onConfirmHandler: () => void;
  onCancelHandler: () => void;
}

interface AppUIContextType {
  showAlert: (message: string, title?: string, variant?: 'info' | 'success' | 'warning' | 'danger') => Promise<void>;
  showConfirm: (message: string, title?: string, variant?: 'info' | 'success' | 'warning' | 'danger', confirmText?: string, cancelText?: string) => Promise<boolean>;
  showToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}

const AppUIContext = createContext<AppUIContextType | undefined>(undefined);

export const AppUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogData[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showAlert = useCallback((message: string, title?: string, variant: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    return new Promise<void>((resolve) => {
      setDialogs(prev => [...prev, {
        message,
        title,
        variant,
        showCancel: false,
        onConfirmHandler: () => {
          setDialogs(d => d.slice(1));
          resolve();
        },
        onCancelHandler: () => {
          setDialogs(d => d.slice(1));
          resolve();
        }
      }]);
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string, variant: 'info' | 'success' | 'warning' | 'danger' = 'warning', confirmText = 'OK', cancelText = 'Отмена') => {
    return new Promise<boolean>((resolve) => {
      setDialogs(prev => [...prev, {
        message,
        title,
        variant,
        showCancel: true,
        confirmText,
        cancelText,
        onConfirmHandler: () => {
          setDialogs(d => d.slice(1));
          resolve(true);
        },
        onCancelHandler: () => {
          setDialogs(d => d.slice(1));
          resolve(false);
        }
      }]);
    });
  }, []);

  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppUIContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      
      {dialogs.length > 0 && (
        <AppDialog 
          isOpen={true}
          {...dialogs[0]}
          onConfirm={dialogs[0].onConfirmHandler}
          onCancel={dialogs[0].onCancelHandler}
        />
      )}

      <div className="fixed bottom-safe-4 left-0 right-0 z-[90] flex flex-col items-center gap-2 pointer-events-none pb-4">
        {toasts.map(toast => (
          <AppToast 
            key={toast.id} 
            id={toast.id} 
            message={toast.message} 
            variant={toast.variant} 
            onClose={removeToast} 
          />
        ))}
      </div>
    </AppUIContext.Provider>
  );
};

export const useAppUI = () => {
  const context = useContext(AppUIContext);
  if (context === undefined) {
    throw new Error('useAppUI must be used within an AppUIProvider');
  }
  return context;
};
