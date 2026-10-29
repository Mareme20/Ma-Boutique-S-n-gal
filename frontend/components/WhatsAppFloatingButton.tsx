'use client';

import { useState, useEffect } from 'react';
import { WA, fcfa } from '@/lib/api';
import { readCart, CartLine } from '@/lib/cart';

export default function WhatsAppFloatingButton() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const update = () => setCart(readCart());
    update();
    window.addEventListener('cart', update);

    // Hide tooltip after 8 seconds to stay discreet
    const timer = setTimeout(() => setShowTooltip(false), 9000);

    return () => {
      window.removeEventListener('cart', update);
      clearTimeout(timer);
    };
  }, []);

  const totalItems = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);

  // Generate customized WhatsApp message based on cart state
  const message = totalItems > 0
    ? `Bonjour Teranga Atelier ! 🇸🇳\nJe souhaite valider ma commande directe de ${totalItems} article(s) (${fcfa(subtotal)}) :\n` +
      cart.map(l => `• ${l.quantity}x ${l.name}`).join('\n') +
      `\nPouvez-vous m'indiquer le délai de livraison à Dakar ?`
    : `Bonjour Teranga Atelier ! 🇸🇳\nJe souhaite passer une commande directe ou obtenir des informations sur vos pièces en Bazin et maroquinerie.`;

  const waUrl = `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
      {/* Discreet floating pill / tooltip */}
      {showTooltip && (
        <div className="mb-2 hidden sm:flex items-center gap-1.5 rounded-full border border-sand-200 bg-white/95 px-3 py-1 shadow-luxury backdrop-blur-sm transition-all duration-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <p className="text-xs font-semibold text-onyx">
            {totalItems > 0 ? (
              <>Commander {totalItems} article{totalItems > 1 ? 's' : ''} en direct</>
            ) : (
              <>Commander en direct WhatsApp</>
            )}
          </p>
          <span className="rounded bg-terracotta-100 px-1 text-[10px] font-bold text-terracotta-700">🇸🇳 Dakar</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="ml-1 text-onyx-light hover:text-onyx text-xs"
            aria-label="Fermer l'infobulle"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#20ba59] to-[#25D366] p-3 sm:px-4 sm:py-3 text-white shadow-fab transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-terracotta-500/80"
        aria-label="Commander directement via WhatsApp"
      >
        {/* Pulsing beacon in terracotta/white */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-terracotta-500 text-[9px] font-bold text-white items-center justify-center">
            {totalItems > 0 ? totalItems : '✦'}
          </span>
        </span>

        {/* WhatsApp Icon */}
        <div className="flex h-7 w-7 items-center justify-center">
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </div>

        {/* Text label */}
        <span className="hidden sm:inline-block font-sans text-xs font-bold tracking-wide">
          Commander sur WhatsApp
        </span>
      </a>
    </div>
  );
}
