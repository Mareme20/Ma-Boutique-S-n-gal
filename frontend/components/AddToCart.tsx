'use client';
import { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { Product, WA, fcfa } from '@/lib/api';

export default function AddToCart({ p }: { p: Product }) {
  const [done, setDone] = useState(false);
  const text = encodeURIComponent(`Bonjour, je veux commander ${p.name} au prix de ${fcfa(p.price)}`);
  return (
    <div className="flex flex-col gap-3">
      <button disabled={p.stock < 1}
        onClick={() => { addToCart({ id: p.id, name: p.name, price: p.price }); setDone(true); }}
        className="rounded-lg bg-indigo px-5 py-3 font-semibold text-white disabled:opacity-40">
        {p.stock < 1 ? 'Épuisé' : done ? 'Ajouté au panier' : 'Ajouter au panier'}
      </button>
      <a href={`https://wa.me/${WA}?text=${text}`} target="_blank" rel="noopener"
         className="rounded-lg bg-leaf px-5 py-3 text-center font-semibold text-white">Commander sur WhatsApp</a>
    </div>
  );
}
