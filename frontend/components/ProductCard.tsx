'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, fcfa } from '@/lib/api';
import { addToCart } from '@/lib/cart';

export default function ProductCard({
  product,
  priority = false,
  badgeText,
}: {
  product: Product;
  priority?: boolean;
  badgeText?: string;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      slug: product.slug,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // Determine an elegant badge if not provided
  const badge = badgeText || (product.price > 40000 ? 'Top Vente' : product.stock < 10 ? 'Pièce Rare' : 'Nouveau');

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-sand-200/80 bg-white transition-all duration-300 hover:border-terracotta-300 hover:shadow-luxury">
      
      {/* Product Image Area */}
      <Link href={`/produit/${product.slug}`} className="block relative aspect-[4/5] w-full overflow-hidden bg-sand-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sand-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge: Top Vente / Nouveau / etc. */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
          <span className="inline-block rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-terracotta-700 shadow-sm backdrop-blur-sm border border-sand-200/60">
            {badge}
          </span>
        </div>

        {/* Subtle quick Add-to-cart Floating Action Button (Mobile-friendly thumb target) */}
        <button
          onClick={handleAdd}
          disabled={product.stock < 1}
          aria-label={`Ajouter ${product.name} au panier`}
          className={`absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full shadow-md transition-all duration-200 active:scale-90 ${
            added
              ? 'bg-emerald-600 text-white scale-105'
              : 'bg-white/95 text-onyx hover:bg-terracotta-500 hover:text-white backdrop-blur-sm border border-sand-200/80'
          }`}
        >
          {added ? (
            <svg className="h-5 w-5 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </Link>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        <div>
          {/* Subtle Category or Origin */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-onyx-light mb-1">
            <span className="truncate max-w-[140px] text-terracotta-700 font-semibold">
              {product.shop ? `🏪 ${product.shop.name}` : 'Dakar • Fait Main'}
            </span>
            {product.stock < 5 && (
              <span className="text-amber-700 font-semibold shrink-0">Dernières pièces</span>
            )}
          </div>

          {/* Product Name */}
          <Link href={`/produit/${product.slug}`} className="group-hover:text-terracotta-600 transition">
            <h3 className="font-serif text-xs sm:text-sm md:text-base font-bold text-onyx line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Delivery Note */}
        <div className="mt-2.5 flex items-baseline justify-between border-t border-sand-100 pt-2">
          <div>
            <span className="font-sans text-xs sm:text-sm md:text-base font-extrabold text-terracotta-600">
              {fcfa(product.price)}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-onyx-light font-medium">
            TTC
          </span>
        </div>
      </div>

    </div>
  );
}
