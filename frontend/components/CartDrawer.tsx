'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartLine, readCart, updateQuantity, removeFromCart } from '@/lib/cart';
import { fcfa, getWhatsAppCartLink } from '@/lib/api';

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    const refresh = () => setCart(readCart());
    refresh();

    const handleOpen = () => {
      refresh();
      setOpen(true);
    };

    window.addEventListener('cart', refresh);
    window.addEventListener('open-cart', handleOpen);

    return () => {
      window.removeEventListener('cart', refresh);
      window.removeEventListener('open-cart', handleOpen);
    };
  }, []);

  const totalItems = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-onyx/50 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-onyx">Mon Panier</h2>
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs font-semibold text-terracotta-700">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-onyx-muted hover:bg-sand-50 hover:text-onyx active:scale-95 transition"
              aria-label="Fermer le panier"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-50 text-sand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="font-serif text-lg font-semibold text-onyx">Votre panier est vide</p>
                <p className="mt-1 text-sm text-onyx-muted max-w-xs">
                  Découvrez nos créations exclusives en Bazin riche et artisanat d'art sénégalais.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 rounded-full bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-600 transition"
                >
                  Explorer la collection
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-sand-100">
                {cart.map((item) => (
                  <li key={item.id} className="py-4 flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-sand-200/60 bg-sand-50">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sand-400">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-onyx line-clamp-1">{item.name}</h3>
                          <p className="text-xs font-bold text-terracotta-600 mt-0.5">{fcfa(item.price)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-onyx-light hover:text-red-500 transition p-1"
                          aria-label="Supprimer l'article"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center rounded-lg border border-sand-200 bg-sand-50/50 p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-onyx hover:bg-white transition active:scale-95"
                            aria-label="Diminuer la quantité"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-onyx">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-onyx hover:bg-white transition active:scale-95"
                            aria-label="Augmenter la quantité"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs font-bold text-onyx">
                          {fcfa(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="border-t border-sand-200 bg-sand-50/40 p-5 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-onyx-muted">
                  <span>Sous-total</span>
                  <span className="font-semibold text-onyx">{fcfa(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-onyx-muted">
                  <span>Livraison estimée (Dakar)</span>
                  <span className="font-medium text-emerald-700">Dès 1 500 FCFA</span>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-2 text-base font-bold text-onyx">
                  <span>Total estimé</span>
                  <span className="text-terracotta-700 font-serif text-lg">{fcfa(subtotal)}</span>
                </div>
              </div>

              {/* Senegal 1-Click WhatsApp Shortcut */}
              <a
                href={getWhatsAppCartLink(cart, subtotal)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-wa py-3.5 px-4 font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Commander via WhatsApp</span>
              </a>

              {/* Standard Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-onyx py-3.5 px-4 font-semibold text-white shadow hover:bg-onyx-soft transition active:scale-98"
              >
                Paiement Sécurisé & Livraison
              </Link>

              <p className="text-center text-[11px] text-onyx-light">
                🇸🇳 Paiement à la réception ou Wave / Orange Money sans frais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
