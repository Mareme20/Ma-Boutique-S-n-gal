import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import ToastNotification from '@/components/ToastNotification';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';

export const metadata = {
  title: 'TERANGA Atelier Dakar — Haute Couture & Artisanat Sénégalais',
  description:
    'Maison de luxe sénégalaise. Bazin riche Getzner brodé main, thiouraye impérial et maroquinerie de prestige. Livraison express à Dakar et régions. Paiement Wave, Orange Money ou à la livraison.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen bg-white text-onyx flex flex-col selection:bg-terracotta-100 selection:text-terracotta-900">
        
        {/* Sticky Header with Search Icon & Cart Badge */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>

        {/* Global Cart Slide-over Drawer */}
        <CartDrawer />

        {/* Global Toast for Touch Feedback */}
        <ToastNotification />

        {/* Senegal Local Checkout Shortcut: Floating WhatsApp Action Button */}
        <WhatsAppFloatingButton />

        {/* Luxury Footer */}
        <footer className="border-t border-sand-200 bg-sand-50/70 pt-12 pb-16 text-onyx">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
              
              {/* Brand Column */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold tracking-[0.2em] text-onyx">
                    TERANGA
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-terracotta-600">
                    Atelier • Dakar
                  </span>
                </div>
                <p className="text-xs text-onyx-muted leading-relaxed">
                  L’excellence de l’artisanat d’art et de la couture sénégalaise. Pièces uniques confectionnées avec passion à Dakar.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-semibold text-onyx">Atelier ouvert à Dakar</span>
                </div>
              </div>

              {/* Collections Column */}
              <div>
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-onyx mb-3">
                  Collections
                </h4>
                <ul className="space-y-2 text-xs text-onyx-muted">
                  <li><Link href="/#collection" className="hover:text-terracotta-600 transition">Boubous & Bazin Riche</Link></li>
                  <li><Link href="/#collection" className="hover:text-terracotta-600 transition">Thiouraye & Encens Royal</Link></li>
                  <li><Link href="/#collection" className="hover:text-terracotta-600 transition">Maroquinerie de Thiès</Link></li>
                  <li><Link href="/#collection" className="hover:text-terracotta-600 transition">Bijoux Filigrane d'Or</Link></li>
                </ul>
              </div>

              {/* Customer Service & Senegal Delivery */}
              <div>
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-onyx mb-3">
                  Livraison & Service
                </h4>
                <ul className="space-y-2 text-xs text-onyx-muted">
                  <li>Livraison Express 24h à Dakar</li>
                  <li>Expédition Régions en 48h</li>
                  <li>Paiement à la réception disponible</li>
                  <li>Échanges garantis sous 48h</li>
                </ul>
              </div>

              {/* Contact & Senegal Payment Badges */}
              <div>
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-onyx mb-3">
                  Paiements Sécurisés
                </h4>
                <p className="text-xs text-onyx-muted mb-3">
                  Réglez en toute confiance sans frais supplémentaires :
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-100">
                    Wave
                  </span>
                  <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 border border-orange-100">
                    Orange Money
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    À la Livraison
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-sand-200">
                  <p className="text-xs text-onyx-muted">
                    WhatsApp Concierge : <span className="font-bold text-onyx">+221 77 000 00 00</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Copyright & Disclaimer */}
            <div className="mt-12 border-t border-sand-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-onyx-light gap-2">
              <p>© 2026 TERANGA Atelier. Tous droits réservés.</p>
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-terracotta-700 hover:underline font-semibold">
                  Accès Panel Admin 🔐
                </Link>
                <span>•</span>
                <p>Conçu avec excellence pour le Sénégal 🇸🇳</p>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
