import * as Toast from '@radix-ui/react-toast';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ToastContext } from './toastContext';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((title: string, description?: string) => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id, title, description }]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <Toast.Provider swipeDirection="right">
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      {messages.map((message) => (
        <Toast.Root key={message.id} className="toast-root" duration={3200} onOpenChange={(open) => !open && setMessages((current) => current.filter((item) => item.id !== message.id))}>
          <Toast.Title className="title-md">{message.title}</Toast.Title>
          {message.description ? <Toast.Description className="muted text-sm">{message.description}</Toast.Description> : null}
        </Toast.Root>
      ))}
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
