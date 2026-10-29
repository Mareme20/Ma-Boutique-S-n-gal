'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API, fcfa } from '@/lib/api';

type Tracking = {
  reference: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  expires_at: string | null;
  delivery_status: string;
  delivery_history: {status:string;note:string|null;created_at:string}[];
  items: { product_name: string; quantity: number; unit_price: number }[];
};

function TrackingDetails() {
  const params = useSearchParams();
  const reference = params.get('reference') || '';
  const token = params.get('token') || '';
  const [order, setOrder] = useState<Tracking | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference || !token) { setError('Lien de suivi incomplet.'); return; }
    let live=true;
    const load=()=>fetch(`${API}/orders/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' }, cache: 'no-store',
    }).then(async response => {
      if (!response.ok) throw new Error('Lien de suivi invalide ou commande introuvable.');
      const data=await response.json(); if(live) setOrder(data);
    }).catch(e => { if(live) setError(e.message || 'Impossible de charger le suivi.'); });
    load(); const timer=window.setInterval(load,30000);
    return ()=>{ live=false; window.clearInterval(timer); };
  }, [reference, token]);

  const labels: Record<string, string> = {
    pending: 'En attente de paiement ou de confirmation', paid: 'Paiement confirmé',
    assigned: 'Commande confiée au livreur', delivered: 'Commande livrée',
    failed: 'Paiement échoué ou délai dépassé', cancelled: 'Commande annulée',
  };

  return <main className="mx-auto max-w-xl px-4 py-12">
    <section className="rounded-3xl border border-sand-200 bg-white p-7 shadow-luxury">
      <Link href="/" className="text-xs font-bold uppercase tracking-widest text-terracotta-600">Teranga Atelier</Link>
      <h1 className="mt-2 font-serif text-3xl font-bold text-onyx">Suivi de commande</h1>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!order && !error && <p className="mt-5 text-sm text-onyx-muted">Chargement du statut…</p>}
      {order && <>
        <p className="mt-5 text-sm text-onyx-muted">Référence <strong className="font-mono text-onyx">{order.reference}</strong></p>
        <p className="mt-2 rounded-xl bg-sand-50 p-4 font-semibold text-onyx">{labels[order.status] || order.status}</p>
        <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-onyx-muted">Étapes de livraison</h2>
        <ol className="mt-2 space-y-2 text-sm">
          {[['preparing','En préparation'],['ready','Prête à expédier'],['shipped','Expédiée'],['delivered','Livrée']].map(([status,label])=>{
            const entry=order.delivery_history?.find(item=>item.status===status);
            const current=['unprepared','preparing','ready','shipped','delivered'].indexOf(order.delivery_status)>=['unprepared','preparing','ready','shipped','delivered'].indexOf(status);
            return <li key={status} className={`flex justify-between rounded-lg px-3 py-2 ${current?'bg-emerald-50 text-emerald-800':'bg-sand-50 text-onyx-muted'}`}><span>{label}</span><span>{entry ? new Date(entry.created_at).toLocaleString('fr-FR') : current ? 'En cours' : 'À venir'}</span></li>;
          })}
        </ol>
        <ul className="mt-4 divide-y divide-sand-200 text-sm">
          {order.items.map((item, i) => <li key={i} className="flex justify-between py-2">
            <span>{item.quantity} × {item.product_name}</span><span>{fcfa(item.quantity * item.unit_price)}</span>
          </li>)}
        </ul>
        <p className="mt-3 border-t border-sand-200 pt-3 text-right font-bold">Total : {fcfa(order.total_amount)}</p>
      </>}
      <Link href="/" className="mt-6 inline-flex rounded-xl border border-sand-200 px-4 py-2 text-sm font-semibold text-onyx">Retour à l’accueil</Link>
    </section>
  </main>;
}

export default function TrackingPage() {
  return <Suspense fallback={<main className="p-12 text-center">Chargement…</main>}><TrackingDetails /></Suspense>;
}
