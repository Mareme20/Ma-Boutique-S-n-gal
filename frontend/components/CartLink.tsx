'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readCart } from '@/lib/cart';
export default function CartLink() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const u = () => setN(readCart().reduce((s, l) => s + l.quantity, 0));
    u(); window.addEventListener('cart', u);
    return () => window.removeEventListener('cart', u);
  }, []);
  return <Link href="/checkout" className="rounded-full bg-mango px-4 py-2 text-sm font-bold text-indigo-dark">Panier ({n})</Link>;
}
