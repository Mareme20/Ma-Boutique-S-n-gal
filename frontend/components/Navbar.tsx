'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { readCart } from '@/lib/cart';

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const items = readCart();
      setCartCount(items.reduce((acc, curr) => acc + curr.quantity, 0));
    };
    update();

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('cart', update);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('cart', update);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Top Reassurance Micro Banner */}
      <div className="bg-onyx text-sand-100 py-1.5 px-3 text-center text-[10px] sm:text-xs font-medium tracking-widest uppercase">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-terracotta-400"></span>
          <span>Livraison Express à Dakar • Wave, Orange Money ou à la livraison</span>
          <span className="hidden sm:inline">• 100% Confection Artisanale</span>
        </span>
      </div>

      {/* Sticky Compact Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-luxury-sm border-b border-sand-200/70'
            : 'bg-white border-b border-sand-100'
        }`}
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left: Quick Search Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="group flex items-center gap-2 rounded-full p-2 text-onyx hover:bg-sand-50 active:scale-95 transition"
              aria-label="Rechercher des produits"
            >
              <svg className="h-5 w-5 text-onyx-muted group-hover:text-terracotta-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden md:inline-block text-xs font-medium text-onyx-light">Rechercher...</span>
            </button>
          </div>

          {/* Center: Minimalist Luxury Logo */}
          <Link href="/" className="group flex flex-col items-center justify-center text-center">
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.22em] text-onyx group-hover:text-terracotta-600 transition">
              TERANGA
            </span>
            <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.3em] text-terracotta-600">
              Atelier • Dakar
            </span>
          </Link>

          {/* Right: Shopping Cart Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
              className="relative flex items-center justify-center rounded-full p-2 text-onyx hover:bg-sand-50 active:scale-95 transition"
              aria-label="Voir le panier"
            >
              <svg className="h-6 w-6 text-onyx" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.7}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] sm:text-xs font-bold text-white shadow-sm animate-pulse-short">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
