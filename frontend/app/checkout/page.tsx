'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, fcfa, WA } from '@/lib/api';
import { CartLine, readCart, writeCart } from '@/lib/cart';

const REGIONS = [
  'Dakar',
  'Thiès',
  'Diourbel',
  'Saint-Louis',
  'Louga',
  'Kaolack',
  'Fatick',
  'Kaffrine',
  'Kolda',
  'Ziguinchor',
  'Sédhiou',
  'Tambacounda',
  'Kédougou',
  'Matam',
];

const FEES: Record<string, number> = {
  Dakar: 1500,
  Thiès: 2500,
  Diourbel: 3500,
  'Saint-Louis': 4000,
};

const PAY = [
  { id: 'wave', label: 'Wave', desc: 'Paiement direct sécurisé Wave Sénégal' },
  { id: 'orange_money', label: 'Orange Money', desc: 'Code de paiement ou transfert OM' },
  { id: 'cod', label: 'Paiement à la livraison', desc: 'Payez en espèces ou Wave lors de la remise du colis' },
] as const;

export default function Checkout() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [f, setF] = useState({
    customer_name: '',
    customer_phone: '',
    region: 'Dakar',
    ville_quartier: '',
    points_repere: '',
    payment_method: 'wave',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  useEffect(() => setCart(readCart()), []);

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const fee = FEES[f.region] ?? 5000;
  async function applyCoupon() {
    setCouponBusy(true); setCouponMessage(''); setDiscount(0);
    try {
      const response = await fetch(`${API}/coupons/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ code: couponCode, subtotal }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Code promo invalide.');
      setDiscount(data.discount_amount); setCouponMessage(`Code appliqué : −${fcfa(data.discount_amount)}`);
    } catch (e) { setCouponMessage((e as Error).message); }
    finally { setCouponBusy(false); }
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);

    try {
      const r = await fetch(API + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...f,
          coupon_code: discount ? couponCode : undefined,
          items: cart.map((l) => ({ product_id: l.id, quantity: l.quantity })),
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.message || (Object.values(d.errors || {}).flat()[0] as string) || 'Erreur lors de la validation.');

      writeCart([]);
      setTrackingToken(d.tracking_token || '');
      if (d.payment_url) {
        window.location.href = d.payment_url;
        return;
      }
      setDone(d.reference);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-12 px-4 sm:px-6">
        <div className="rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-luxury">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">Teranga Atelier</span>
          <h1 className="mt-1 font-serif text-2xl font-bold text-onyx">Commande Confirmée</h1>
          <p className="mt-2 text-sm text-onyx-muted">
            Merci pour votre confiance ! Votre référence de commande est :
          </p>
          <div className="my-4 rounded-xl border border-sand-200 bg-sand-50 p-3 font-mono text-base font-bold text-terracotta-700">
            {done}
          </div>
          {trackingToken && (
            <Link href={`/suivi?reference=${encodeURIComponent(done)}&token=${encodeURIComponent(trackingToken)}`} className="mb-4 inline-flex text-sm font-bold text-terracotta-700 underline">
              Consulter le statut de ma commande
            </Link>
          )}
          <p className="text-xs text-onyx-muted leading-relaxed">
            Notre service client dakarois vous contacte par téléphone ou WhatsApp pour convenir de l'heure exacte de livraison.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent(`Bonjour, je viens de passer la commande réf ${done}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa py-3 px-5 text-sm font-bold text-white shadow hover:bg-wa-dark transition"
            >
              Suivre ma commande sur WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-sand-200 bg-white py-3 px-5 text-sm font-semibold text-onyx hover:bg-sand-50 transition"
            >
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className="rounded-3xl border border-sand-200 bg-white p-10 shadow-luxury">
          <p className="font-serif text-xl font-bold text-onyx">Votre panier est vide</p>
          <p className="mt-2 text-xs sm:text-sm text-onyx-muted">
            Découvrez nos créations exclusives en Bazin riche et maroquinerie sénégalaise.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-terracotta-500 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow hover:bg-terracotta-600 transition"
          >
            Découvrir la collection
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle =
    'w-full rounded-xl border border-sand-300 bg-white px-3.5 py-3 text-sm text-onyx placeholder:text-onyx-light outline-none transition focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500';

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6">
      
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-onyx-muted">
        <Link href="/" className="hover:text-terracotta-600 transition">Accueil</Link>
        <span>/</span>
        <span className="font-semibold text-onyx">Finalisation de commande</span>
      </nav>

      <form onSubmit={submit} className="space-y-6">
        
        {/* Header */}
        <div className="border-b border-sand-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600">Livraison Sénégal</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-onyx">
            Finaliser votre Commande
          </h1>
        </div>

        {/* Cart Summary Card */}
        <div className="rounded-2xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-onyx">Récapitulatif des articles</h2>
          <ul className="divide-y divide-sand-200/60 text-xs sm:text-sm">
            {cart.map((l) => (
              <li key={l.id} className="flex justify-between py-2 text-onyx">
                <span className="font-medium">
                  {l.quantity} × {l.name}
                </span>
                <span className="font-bold text-terracotta-700">{fcfa(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-sand-200 pt-3 space-y-1 text-xs">
            <div className="flex gap-2 pt-2">
              <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setDiscount(0); setCouponMessage(''); }} placeholder="Code promo" className={inputStyle} />
              <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponCode} className="rounded-xl bg-onyx px-4 text-xs font-bold text-white disabled:opacity-50">Appliquer</button>
            </div>
            {couponMessage && <p className={discount ? 'text-emerald-700' : 'text-red-600'}>{couponMessage}</p>}
            <div className="flex justify-between text-onyx-muted">
              <span>Sous-total articles</span>
              <span className="font-semibold text-onyx">{fcfa(subtotal)}</span>
            </div>
            <div className="flex justify-between text-onyx-muted">
              <span>Réduction</span><span className="font-semibold text-emerald-700">−{fcfa(discount)}</span>
            </div>
            <div className="flex justify-between text-onyx-muted">
              <span>Frais de livraison ({f.region})</span>
              <span className="font-semibold text-onyx">{fcfa(fee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-onyx pt-2 border-t border-sand-200">
              <span>Total à régler</span>
              <span className="font-serif text-lg text-terracotta-700">{fcfa(subtotal + fee - discount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-4 shadow-luxury-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-onyx flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-700 text-[10px]">1</span>
            Vos Coordonnées de Livraison
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-onyx-muted mb-1">Nom complet *</label>
              <input
                required
                className={inputStyle}
                placeholder="Ex. Fatou Ndiaye"
                value={f.customer_name}
                onChange={set('customer_name')}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-muted mb-1">Téléphone (WhatsApp de préférence) *</label>
              <input
                required
                className={inputStyle}
                placeholder="Ex. 77 123 45 67"
                inputMode="tel"
                value={f.customer_phone}
                onChange={set('customer_phone')}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-onyx-muted mb-1">Région du Sénégal *</label>
              <select
                className={inputStyle}
                value={f.region}
                onChange={set('region')}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} (Livraison {fcfa(FEES[r] ?? 5000)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-muted mb-1">Quartier & Ville *</label>
              <input
                required
                className={inputStyle}
                placeholder="Ex. Almadies, Mermoz, Plateau..."
                value={f.ville_quartier}
                onChange={set('ville_quartier')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-onyx-muted mb-1">Point de repère ou instructions de livraison *</label>
            <textarea
              required
              className={inputStyle}
              rows={2}
              placeholder="Ex. En face de la pharmacie, portail marron..."
              value={f.points_repere}
              onChange={set('points_repere')}
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-4 shadow-luxury-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-onyx flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-700 text-[10px]">2</span>
            Mode de Règlement
          </h2>

          <div className="space-y-2.5">
            {PAY.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                  f.payment_method === p.id
                    ? 'border-terracotta-500 bg-terracotta-50/50 ring-1 ring-terracotta-500'
                    : 'border-sand-200 bg-white hover:bg-sand-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={f.payment_method === p.id}
                  onChange={() => setF({ ...f, payment_method: p.id })}
                  className="mt-0.5 text-terracotta-600 focus:ring-terracotta-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-onyx">{p.label}</span>
                    {p.id === 'wave' && (
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Wave</span>
                    )}
                    {p.id === 'orange_money' && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">OM</span>
                    )}
                    {p.id === 'cod' && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Espèces</span>
                    )}
                  </div>
                  <p className="text-xs text-onyx-muted mt-0.5">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {err && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
            {err}
          </div>
        )}

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-terracotta-500 py-4 px-6 text-sm sm:text-base font-bold text-white shadow-md hover:bg-terracotta-600 active:scale-98 transition duration-200 disabled:opacity-50"
        >
          {busy
            ? 'Traitement de votre commande…'
            : f.payment_method === 'cod'
            ? `Valider la commande • ${fcfa(subtotal + fee)} à la livraison`
            : `Payer maintenant via ${f.payment_method === 'wave' ? 'Wave' : 'Orange Money'} (${fcfa(subtotal + fee)})`}
        </button>

        <p className="text-center text-[11px] text-onyx-light">
          Vos données sont strictement confidentielles. Livraison assurée par nos coursiers certifiés.
        </p>

      </form>
    </div>
  );
}
