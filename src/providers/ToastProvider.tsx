import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { Alert } from 'react-native';

type ToastOptions = {
  title?: string;
  message: string;
  type?: 'default' | 'success' | 'error';
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = useCallback(({ title, message }: ToastOptions) => {
    Alert.alert(title ?? 'Notification', message);
  }, []);

  return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};

