export type CartLine = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  slug?: string;
};

const KEY = 'cart-v1';

export const readCart = (): CartLine[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const writeCart = (c: CartLine[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent('cart', { detail: c }));
};

export function addToCart(item: { id: number; name: string; price: number; image_url?: string | null; slug?: string; quantity?: number }) {
  const cart = readCart();
  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const existing = cart.find(x => x.id === item.id);
  
  if (existing) {
    existing.quantity += qty;
    if (item.image_url && !existing.image_url) existing.image_url = item.image_url;
    if (item.slug && !existing.slug) existing.slug = item.slug;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      image_url: item.image_url ?? null,
      slug: item.slug,
    });
  }
  
  writeCart(cart);
  window.dispatchEvent(new CustomEvent('cart-item-added', { detail: item }));
}

export function updateQuantity(id: number, delta: number) {
  const cart = readCart();
  const index = cart.findIndex(x => x.id === id);
  if (index !== -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    writeCart(cart);
  }
}

export function removeFromCart(id: number) {
  const cart = readCart().filter(x => x.id !== id);
  writeCart(cart);
}

export function clearCart() {
  writeCart([]);
}
