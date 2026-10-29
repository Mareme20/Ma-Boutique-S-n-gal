'use client';

import { useState } from 'react';
import { Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export default function ProductGridSection({ products }: { products: Product[] }) {
  type Category = { id: string; label: string; shopId?: number; match?: string[] };
  const [activeFilter, setActiveFilter] = useState('all');

  // Extract unique shops from products
  const shops = Array.from(
    new Map(
      products
        .filter((p) => p.shop)
        .map((p) => [p.shop!.id, p.shop!])
    ).values()
  );

  const categories: Category[] = [
    { id: 'all', label: 'Toutes les créations' },
    ...shops.map((s) => ({
      id: `shop-${s.id}`,
      label: `🏪 ${s.name} (${s.city})`,
      shopId: s.id,
    })),
    { id: 'bazin', label: 'Bazin & Boubous', match: ['bazin', 'boubou', 'robe'] },
    { id: 'senteurs', label: 'Thiouraye & Senteurs', match: ['thiouraye', 'brume', 'musc', 'gongo'] },
    { id: 'cuir', label: 'Maroquinerie & Cuir', match: ['cuir', 'sac', 'cabas', 'babouche'] },
    { id: 'bijoux', label: 'Bijoux & Filigrane', match: ['bijou', 'manchette', 'créoles', 'filigrane'] },
  ];

  const filteredProducts = activeFilter === 'all'
    ? products
    : products.filter((p) => {
        const selected = categories.find((c) => c.id === activeFilter);
        if (!selected) return true;

        // Filter by shop
        if (selected.id.startsWith('shop-')) {
          return p.shop_id === selected.shopId || p.shop?.id === selected.shopId;
        }

        // Filter by keyword
        if (selected.match) {
          const text = `${p.name} ${p.description || ''}`.toLowerCase();
          return selected.match.some((m) => text.includes(m));
        }

        return true;
      });

  return (
    <section id="collection" className="py-12 sm:py-16 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-sand-200/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-terracotta-600 mb-1.5">
              <span>Collection Multi-Boutiques</span>
              <span className="h-1 w-1 rounded-full bg-terracotta-400"></span>
              <span>Dakar • Thiès • Saint-Louis</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-onyx">
              Les Trésors de nos Ateliers
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-onyx-muted max-w-md">
            Découvrez les pièces authentiques de nos ateliers partenaires au Sénégal, avec commande directe par boutique.
          </p>
        </div>

        {/* Mobile-first Touch Filter Pills (Shops & Categories) */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveFilter(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                activeFilter === c.id
                  ? 'bg-onyx text-white shadow-sm'
                  : 'bg-sand-50 text-onyx-muted hover:bg-sand-100 hover:text-onyx border border-sand-200/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 2-Column Mobile Grid Layout */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-sand-200 bg-sand-50/50 p-10 text-center">
            <p className="font-serif text-base font-semibold text-onyx">Aucun produit dans cette sélection</p>
            <p className="text-xs text-onyx-muted mt-1">Revenez à la collection complète pour découvrir toutes nos créations.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-4 rounded-full bg-terracotta-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-terracotta-600 transition"
            >
              Voir toute la collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {filteredProducts.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={idx < 4}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
