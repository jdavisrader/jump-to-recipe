// Simplified toast implementation
import { useState } from 'react';

type ToastVariant = 'default' | 'destructive';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    setToasts((prev) => [...prev, props]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== props));
    }, 3000);
  };

  return { toast, toasts };
}