'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fcfa } from '@/lib/api';

type ToastData = {
  name: string;
  price: number;
  image_url?: string | null;
};

export default function ToastNotification() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleAdded = (e: Event) => {
      const customEvent = e as CustomEvent<ToastData>;
      if (customEvent.detail) {
        setToast(customEvent.detail);
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('cart-item-added', handleAdded);
    return () => window.removeEventListener('cart-item-added', handleAdded);
  }, []);

  if (!toast || !visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm transform transition-all duration-300 ease-out animate-bounce-once sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-center gap-3 rounded-2xl border border-sand-200/80 bg-white/95 p-3.5 shadow-luxury backdrop-blur-md">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">Ajouté au panier</p>
          <p className="truncate text-sm font-bold text-onyx">{toast.name}</p>
          <p className="text-xs font-medium text-onyx-muted">{fcfa(toast.price)}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            window.dispatchEvent(new CustomEvent('open-cart'));
          }}
          className="shrink-0 rounded-xl bg-terracotta-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-terracotta-600 active:scale-95"
        >
          Voir panier
        </button>
      </div>
    </div>
  );
}
