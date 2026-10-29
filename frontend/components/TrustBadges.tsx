'use client';

export default function TrustBadges() {
  const badges = [
    {
      title: 'Paiement Wave, OM ou à la Livraison',
      description: 'Réglez directement par Wave, Orange Money ou en espèces à la réception de votre colis. Zéro risque.',
      icon: (
        <svg className="h-6 w-6 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: '🇸🇳 Sénégal',
    },
    {
      title: 'Livraison Rapide Dakar & Régions',
      description: 'Livraison express en 2h à 24h à Dakar (Plateau, Almadies, Mermoz, etc.) et sous 48h en régions.',
      icon: (
        <svg className="h-6 w-6 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: 'Express',
    },
    {
      title: 'Haute Qualité Artisanale',
      description: 'Matières premières authentiques : véritable Bazin Getzner, essences pures de santal et cuir pleine fleur.',
      icon: (
        <svg className="h-6 w-6 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      badge: '100% Garanti',
    },
    {
      title: 'Conciergerie Dédiée 7j/7',
      description: 'Notre équipe dakaroise vous conseille par appel ou WhatsApp pour le choix des tailles et modèles sur-mesure.',
      icon: (
        <svg className="h-6 w-6 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: 'Support VIP',
    },
  ];

  return (
    <section className="bg-sand-50/50 py-10 sm:py-14 border-y border-sand-200/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl border border-sand-200/80 bg-white p-5 shadow-luxury-sm hover:shadow-luxury hover:border-terracotta-300 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 group-hover:bg-terracotta-100 transition">
                    {b.icon}
                  </div>
                  <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[10px] font-bold text-onyx-muted">
                    {b.badge}
                  </span>
                </div>
                <h3 className="font-serif text-sm font-bold text-onyx group-hover:text-terracotta-700 transition">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-xs text-onyx-muted leading-relaxed">
                  {b.description}
                </p>
              </div>

              {/* Local payment method pills in first badge */}
              {idx === 0 && (
                <div className="mt-3.5 flex items-center gap-1.5 pt-2.5 border-t border-sand-100">
                  <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 border border-sky-100">
                    Wave
                  </span>
                  <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 border border-orange-100">
                    Orange Money
                  </span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100">
                    Espèces
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
