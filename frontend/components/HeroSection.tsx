'use client';

import Image from 'next/image';
import Link from 'next/link';
import { WA } from '@/lib/api';

export default function HeroSection() {
  const scrollToProducts = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand-50/70 via-white to-white pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-sand-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Typography & CTAs */}
          <div className="text-center lg:col-span-7 lg:text-left space-y-4 sm:space-y-6">
            {/* Luxury Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-terracotta-200/80 bg-terracotta-50/80 px-3.5 py-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-terracotta-500 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-700">
                Maison d'Artisanat • Dakar 2026
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-onyx leading-[1.12]">
              L’Art de l’Élégance <br className="hidden sm:inline" />
              <span className="italic font-normal text-terracotta-600">Sénégalaise</span>
            </h1>

            {/* Description */}
            <p className="mx-auto max-w-xl text-sm sm:text-base text-onyx-muted lg:mx-0 leading-relaxed font-normal">
              Bazin riche Getzner brodé main, thiouraye impérial macéré selon les secrets traditionnels et maroquinerie d’art de Thiès. Des créations prestigieuses livrées partout au Sénégal.
            </p>

            {/* Punchy Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={scrollToProducts}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-terracotta-500 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-terracotta-600 active:scale-98 transition duration-200"
              >
                <span>Découvrir la collection</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent("Bonjour Teranga Atelier, j'aimerais découvrir votre collection exclusive.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-sand-300 bg-white px-6 py-3.5 text-sm font-semibold text-onyx hover:border-terracotta-400 hover:bg-sand-50 active:scale-98 transition duration-200"
              >
                <span className="h-2 w-2 rounded-full bg-wa"></span>
                <span>Conseil & Commande WhatsApp</span>
              </a>
            </div>

            {/* Micro Reassurances */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-sand-200/60 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <p className="text-xs font-bold text-onyx">Livraison 24h</p>
                <p className="text-[10px] text-onyx-light">À Dakar & banlieue</p>
              </div>
              <div className="text-center lg:text-left border-x border-sand-200 px-2">
                <p className="text-xs font-bold text-onyx">Wave & OM</p>
                <p className="text-[10px] text-onyx-light">Ou à la réception</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-xs font-bold text-onyx">100% Fait Main</p>
                <p className="text-[10px] text-onyx-light">Artisans d'exception</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Hero Banner with Luxury Product Card */}
          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:col-span-5">
            {/* Soft decorative backplate */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sand-200/40 via-terracotta-100/30 to-sand-100/40 blur-xl"></div>
            
            <div className="relative overflow-hidden rounded-3xl border border-sand-200/90 bg-white p-3 shadow-luxury">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-sand-100">
                <Image
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80"
                  alt="Boubou Royal Bazin Getzner brodé main"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                
                {/* Floating Tag */}
                <div className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 shadow-sm backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-700">
                    Édition Cérémonie
                  </span>
                </div>

                {/* Bottom Overlay Info Pill */}
                <div className="absolute bottom-3 inset-x-3 rounded-2xl bg-white/95 p-3.5 shadow-luxury backdrop-blur-md border border-sand-200/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-terracotta-600 uppercase tracking-wider">Pièce Maîtresse</p>
                      <h4 className="font-serif text-sm font-bold text-onyx">Boubou Royal Bazin Riche</h4>
                    </div>
                    <span className="rounded-xl bg-sand-100 px-2.5 py-1 text-xs font-extrabold text-onyx">
                      65 000 FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
