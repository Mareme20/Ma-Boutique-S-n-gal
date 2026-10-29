'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, fcfa } from '@/lib/api';

export default function SearchModal({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    window.addEventListener('open-search', handleOpen);
    return () => window.removeEventListener('open-search', handleOpen);
  }, []);

  const filtered = query.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      );

  const popularTags = ['Bazin Getzner', 'Thiouraye', 'Cuir de Thiès', 'Filigrane', 'Musc Santal'];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-onyx/60 backdrop-blur-sm p-4 sm:p-6 md:p-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white shadow-2xl border border-sand-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-sand-200 px-4 py-3 sm:px-6 sm:py-4">
          <svg className="h-5 w-5 text-terracotta-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un boubou, thiouraye, sac en cuir..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-onyx placeholder:text-onyx-light outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-onyx-light hover:text-onyx p-1"
            >
              Effacer
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-sand-100 p-1.5 text-onyx-muted hover:bg-sand-200 transition"
            aria-label="Fermer la recherche"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Suggestions or Results */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-onyx-light mb-3">
                Recherches fréquentes
              </p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="rounded-full border border-sand-200 bg-sand-50 px-3.5 py-1.5 text-xs font-medium text-onyx-soft hover:border-terracotta-400 hover:bg-terracotta-50 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-onyx-muted">
              <p className="text-sm">Aucun produit ne correspond à « {query} ».</p>
              <p className="text-xs text-onyx-light mt-1">Essayez avec un autre mot-clé ou parcourez notre collection.</p>
            </div>
          ) : (
            <ul className="divide-y divide-sand-100">
              {filtered.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/produit/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-sand-50 transition"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-onyx truncate">{product.name}</p>
                      <p className="text-xs font-bold text-terracotta-600">{fcfa(product.price)}</p>
                    </div>
                    <span className="text-xs font-medium text-terracotta-500">Voir →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
