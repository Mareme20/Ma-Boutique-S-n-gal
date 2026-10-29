'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, fcfa, WA } from '@/lib/api';
import { addToCart } from '@/lib/cart';

const SENEGAL_DELIVERY: Record<string, { fee: number; delay: string }> = {
  'Dakar (Centre & Banlieue)': { fee: 1500, delay: 'En 2h à 24h chrono' },
  'Thiès & Mbour / Saly': { fee: 2500, delay: 'Sous 24h à 48h' },
  'Saint-Louis & Louga': { fee: 4000, delay: 'Sous 48h' },
  'Diourbel & Touba': { fee: 3500, delay: 'Sous 48h' },
  'Ziguinchor & Casamance': { fee: 5000, delay: 'Sous 48h à 72h' },
  'Autres Régions du Sénégal': { fee: 5000, delay: 'Sous 48h à 72h' },
};

export default function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Standard / M');
  const [selectedRegion, setSelectedRegion] = useState('Dakar (Centre & Banlieue)');
  const [activeTab, setActiveTab] = useState<'desc' | 'care' | 'delivery'>('desc');
  const [isAdded, setIsAdded] = useState(false);

  const deliveryInfo = SENEGAL_DELIVERY[selectedRegion];

  const sizes = product.name.toLowerCase().includes('bazin') || product.name.toLowerCase().includes('boubou') || product.name.toLowerCase().includes('robe')
    ? ['Taille M', 'Taille L', 'Taille XL', 'Sur-Mesure (Dakar)']
    : product.name.toLowerCase().includes('thiouraye') || product.name.toLowerCase().includes('brume')
    ? ['Format Découverte 100g', 'Format Prestige 150g', 'Grand Cru 250g']
    : ['Taille Unique Haute Finition'];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: `${product.name} (${selectedSize})`,
      price: product.price,
      image_url: product.image_url,
      slug: product.slug,
      quantity: quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const getWhatsAppLink = () => {
    const targetWa = product.shop?.whatsapp || WA;
    const shopMention = product.shop ? ` à l'atelier *${product.shop.name}* (${product.shop.city})` : ' Teranga Atelier';
    const text = `Bonjour${shopMention} ! 🇸🇳\n\nJe souhaite commander :\n👉 *${product.name}*\n• Quantité : ${quantity}\n• Option : ${selectedSize}\n• Prix unitaire : ${fcfa(product.price)}\n• Région de livraison : ${selectedRegion} (+${fcfa(deliveryInfo.fee)})\n*Total : ${fcfa(product.price * quantity + deliveryInfo.fee)}*\n\nPaiement souhaité : Wave / Orange Money / À la livraison.\nMerci de me contacter !`;
    return `https://wa.me/${targetWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-white pb-20">
      
      {/* Mobile Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs font-medium text-onyx-muted overflow-x-auto whitespace-nowrap py-1">
        <Link href="/" className="hover:text-terracotta-600 transition">Accueil</Link>
        <span>/</span>
        <Link href="/#collection" className="hover:text-terracotta-600 transition">Collection</Link>
        <span>/</span>
        <span className="text-onyx font-semibold truncate max-w-[180px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main Grid: Images & Details */}
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        
        {/* Left Column: Product Showcase Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-sand-200/90 bg-sand-50 shadow-luxury">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sand-300">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-terracotta-700 shadow-sm backdrop-blur-md border border-sand-200/60">
                Fait Main à Dakar
              </span>
              <span className="rounded-full bg-onyx/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                🇸🇳 Teranga Luxe
              </span>
            </div>
          </div>

          {/* Reassurance Grid */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-sand-200 bg-sand-50/60 p-3 text-center text-xs text-onyx-muted">
            <div>
              <p className="font-bold text-onyx">100% Authentique</p>
              <p className="text-[10px] text-onyx-light">Matières certifiées</p>
            </div>
            <div className="border-x border-sand-200">
              <p className="font-bold text-onyx">Livraison Dakar</p>
              <p className="text-[10px] text-emerald-700">Aujourd'hui possible</p>
            </div>
            <div>
              <p className="font-bold text-onyx">Échanges faciles</p>
              <p className="text-[10px] text-onyx-light">Sous 48h à Dakar</p>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Purchase & Delivery Options */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            {/* Rating & Stock status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span>★★★★★</span>
                <span className="text-onyx font-bold">5.0</span>
                <span className="text-onyx-light">(48 avis vérifiés)</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                En stock ({product.stock} dispo)
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-onyx leading-tight">
              {product.name}
            </h1>

            {/* Shop Origin */}
            {product.shop && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-terracotta-700 bg-sand-50 border border-sand-200/80 rounded-xl px-3 py-1.5 w-fit">
                <span>🏪 Atelier : {product.shop.name} ({product.shop.city})</span>
                <span className="text-onyx-light">• WhatsApp : +{product.shop.whatsapp}</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-2xl sm:text-3xl font-extrabold text-terracotta-600">
                {fcfa(product.price)}
              </span>
              <span className="text-xs text-onyx-light uppercase font-medium">TTC • Facture fournie</span>
            </div>

            {/* Short description */}
            <p className="text-sm text-onyx-muted leading-relaxed">
              {product.description}
            </p>

            {/* Size / Variant Options */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-onyx">
                <span>Sélectionner une option :</span>
                <span className="text-terracotta-600 font-medium normal-case">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                      selectedSize === s
                        ? 'bg-onyx text-white shadow-sm ring-2 ring-terracotta-500 ring-offset-1'
                        : 'bg-sand-50 text-onyx-soft hover:bg-sand-100 border border-sand-200/80'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-onyx">
                Quantité :
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-sand-200 bg-sand-50 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-onyx shadow-sm active:scale-95 transition"
                    aria-label="Diminuer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-onyx">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-onyx shadow-sm active:scale-95 transition"
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-onyx-muted">
                  Sous-total : <strong className="text-onyx">{fcfa(product.price * quantity)}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons: Add to Cart & WhatsApp 1-Click */}
            <div className="space-y-3 pt-3">
              {/* Primary Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock < 1}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-terracotta-500 py-4 px-6 text-sm sm:text-base font-bold text-white shadow-md hover:bg-terracotta-600 active:scale-98 transition duration-200 disabled:opacity-40"
              >
                {isAdded ? (
                  <>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ajouté au panier !</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Ajouter au panier ({fcfa(product.price * quantity)})</span>
                  </>
                )}
              </button>

              {/* Direct Senegal WhatsApp 1-Click Checkout */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-wa to-emerald-500 py-3.5 px-6 text-sm sm:text-base font-bold text-white shadow hover:shadow-md active:scale-98 transition duration-200 border border-emerald-400/40"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Commander directement via WhatsApp</span>
              </a>
            </div>

            {/* Senegal Delivery Estimator */}
            <div className="rounded-2xl border border-sand-200 bg-sand-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-onyx flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Estimer la livraison au Sénégal
                </span>
                <span className="text-xs font-extrabold text-terracotta-700">{fcfa(deliveryInfo.fee)}</span>
              </div>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs font-semibold text-onyx outline-none focus:border-terracotta-500"
              >
                {Object.keys(SENEGAL_DELIVERY).map((reg) => (
                  <option key={reg} value={reg}>
                    {reg} — {fcfa(SENEGAL_DELIVERY[reg].fee)}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-xs text-onyx-muted pt-1">
                <span>Délai estimé :</span>
                <span className="font-semibold text-onyx">{deliveryInfo.delay}</span>
              </div>
            </div>

            {/* Local payment reassurance */}
            <div className="pt-2 flex items-center justify-between text-xs text-onyx-muted border-t border-sand-100">
              <span className="font-medium">Moyens de paiement acceptés :</span>
              <div className="flex gap-1.5">
                <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">Wave</span>
                <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">Orange Money</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Espèces</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Accordion Tabs for Craftsmanship, Care & Shipping */}
      <div className="mt-14 max-w-4xl mx-auto border-t border-sand-200 pt-8">
        <div className="flex border-b border-sand-200 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 text-sm font-bold tracking-wide transition border-b-2 whitespace-nowrap ${
              activeTab === 'desc'
                ? 'border-terracotta-600 text-onyx'
                : 'border-transparent text-onyx-muted hover:text-onyx'
            }`}
          >
            Savoir-Faire & Confection
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3 text-sm font-bold tracking-wide transition border-b-2 whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-terracotta-600 text-onyx'
                : 'border-transparent text-onyx-muted hover:text-onyx'
            }`}
          >
            Conseils d’Utilisation & Entretien
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 text-sm font-bold tracking-wide transition border-b-2 whitespace-nowrap ${
              activeTab === 'delivery'
                ? 'border-terracotta-600 text-onyx'
                : 'border-transparent text-onyx-muted hover:text-onyx'
            }`}
          >
            Livraison & Retours au Sénégal
          </button>
        </div>

        <div className="py-6 text-sm text-onyx-muted leading-relaxed">
          {activeTab === 'desc' && (
            <div className="space-y-3">
              <p>
                Toutes nos pièces sont réalisées par des artisans reconnus au Sénégal. Nous privilégions les fibres nobles, les teintures authentiques et les coutures renforcées faites pour durer et briller lors de vos événements majeurs.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Origine certifiée des matières premières (coton, cuir de Thiès, résines odorantes).</li>
                <li>Finition à la main par nos maîtres tailleurs dakarois.</li>
                <li>Contrôle qualité rigoureux avant chaque expédition.</li>
              </ul>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <p>
                Pour préserver l'éclat incomparable de votre création :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Pour le Bazin :</strong> Nettoyage à sec recommandé ou lavage très doux à la main à froid sans torsion. Repassage sur l'envers avec une pattemouille.</li>
                <li><strong>Pour le Thiouraye :</strong> Déposer une petite pincée sur un charbon incandescent bien blanc pour une diffusion optimale et sans fumée noire.</li>
                <li><strong>Pour le Cuir :</strong> Nourrir avec une crème pour cuir naturel une fois par trimestre et garder à l'abri de l'humidité directe.</li>
              </ul>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-3">
              <p>
                Nous livrons directement à votre domicile, bureau ou lieu de votre choix au Sénégal :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Dakar & Banlieue :</strong> Livraison le jour même pour les commandes passées avant 14h, ou sous 24h. Frais fixes : 1 500 FCFA.</li>
                <li><strong>Régions (Thiès, Saint-Louis, Mbour, Touba...) :</strong> Expédition par transport express sécurisé sous 24h à 48h.</li>
                <li><strong>Paiement flexible :</strong> Vous pouvez régler à la réception du colis par Wave, Orange Money ou espèces au coursier.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-sand-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-onyx">
              Vous Aimerez Aussi
            </h2>
            <Link href="/#collection" className="text-xs font-bold text-terracotta-600 hover:underline">
              Voir tout →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {relatedProducts.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/produit/${p.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-sand-200 bg-white p-3 hover:border-terracotta-300 hover:shadow-luxury transition duration-300"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-sand-50">
                  {p.image_url && (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  )}
                </div>
                <div className="mt-2.5">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-onyx line-clamp-1">{p.name}</h4>
                  <p className="text-xs font-bold text-terracotta-600 mt-1">{fcfa(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
