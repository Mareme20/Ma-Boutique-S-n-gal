import { notFound } from 'next/navigation';
import { Product, get } from '@/lib/api';
import ProductDetailClient from '@/components/ProductDetailClient';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Product | null = null;
  let allProducts: Product[] = [];

  try {
    product = await get<Product>('/products/' + id);
  } catch (err) {
    console.error('Error loading product:', err);
  }

  if (!product) {
    notFound();
  }

  try {
    allProducts = await get<Product[]>('/products');
  } catch {}

  const related = allProducts.filter(p => p.id !== product?.id);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={related}
    />
  );
}
