export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const WA = process.env.NEXT_PUBLIC_WHATSAPP || '221770000000';
export const adminHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export type Shop = {
  id: number;
  name: string;
  slug: string;
  city: string;
  whatsapp: string;
  address?: string;
  description?: string;
  image_url?: string | null;
  products_count?: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
  description?: string;
  category?: string;
  badge?: string;
  shop_id?: number | null;
  shop?: Shop | null;
};

export const fcfa = (n: number): string => {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
};

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(API + path, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Generate a direct WhatsApp concierge link for a specific product,
 * routed automatically to the specific shop's WhatsApp hotline if available!
 */
export function getWhatsAppProductLink(product: {
  name: string;
  price: number;
  slug?: string;
  shop?: { name?: string; whatsapp?: string; city?: string } | null;
}): string {
  const targetWa = product.shop?.whatsapp || WA;
  const shopMention = product.shop?.name ? ` chez *${product.shop.name}* (${product.shop.city})` : '';

  const text = `Bonjour ! 🇸🇳\n\nJe souhaite commander${shopMention} :\n👉 *${product.name}*\nPrix : *${fcfa(product.price)}*\n\nPouvez-vous me confirmer la disponibilité et le délai de livraison ?\nMerci !`;
  return `https://wa.me/${targetWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate a direct WhatsApp link for an entire cart
 */
export function getWhatsAppCartLink(
  items: { name: string; quantity: number; price: number }[],
  subtotal: number,
  customWa?: string
): string {
  const targetWa = customWa || WA;

  if (items.length === 0) {
    const text = `Bonjour Teranga Atelier ! 🇸🇳\nJe souhaite avoir des informations sur votre collection et vos délais de livraison.`;
    return `https://wa.me/${targetWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  }

  const itemsList = items
    .map(it => `• ${it.quantity}x ${it.name} (${fcfa(it.price * it.quantity)})`)
    .join('\n');

  const text = `Bonjour Teranga Atelier ! 🇸🇳\n\nJe souhaite valider ma commande directe :\n\n${itemsList}\n\n*Sous-total : ${fcfa(subtotal)}*\n\nPaiement souhaité : Wave / Orange Money / À la livraison.\nMerci de me contacter pour l'adresse de livraison !`;
  return `https://wa.me/${targetWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}
