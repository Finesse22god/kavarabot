import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

let toastCounter = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: string; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        memoryState.toasts.push(action.toast);
      }
      break;
    case 'UPDATE_TOAST':
      memoryState.toasts = memoryState.toasts.map((t) =>
        t.id === action.toast?.id ? { ...t, ...action.toast } : t
      );
      break;
    case 'DISMISS_TOAST':
      memoryState.toasts = memoryState.toasts.filter((t) => t.id !== action.toastId);
      break;
    case 'REMOVE_TOAST':
      memoryState.toasts = memoryState.toasts.filter((t) => t.id !== action.toastId);
      break;
  }

  listeners.forEach((listener) => {
    listener(memoryState.toasts);
  });
}

function generateToastId() {
  toastCounter = (toastCounter + 1) % Number.MAX_VALUE;
  return toastCounter.toString();
}

export function toast({
  title,
  description,
  variant = 'default',
  duration = 5000,
  ...props
}: Omit<Toast, 'id'>) {
  const id = generateToastId();

  const toastItem: Toast = {
    id,
    title,
    description,
    variant,
    duration,
    ...props,
  };

  dispatch({
    type: 'ADD_TOAST',
    toast: toastItem,
  });

  // Auto dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      dispatch({
        type: 'DISMISS_TOAST',
        toastId: id,
      });
    }, duration);
  }

  return {
    id,
    dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
    update: (toast: Partial<Toast>) =>
      dispatch({ type: 'UPDATE_TOAST', toast: { ...toastItem, ...toast } }),
  };
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const unsubscribe = useCallback(() => {
    setState(memoryState);
  }, []);

  // Subscribe to changes
  React.useEffect(() => {
    const unsubscribe = subscribe((toasts) => {
      setState({ toasts });
    });
    return unsubscribe;
  }, [subscribe]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        dispatch({ type: 'DISMISS_TOAST', toastId });
      }
    },
  };
}

// For React import
import React from 'react';