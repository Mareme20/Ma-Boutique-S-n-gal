import { Product, get } from '@/lib/api';
import HeroSection from '@/components/HeroSection';
import TrustBadges from '@/components/TrustBadges';
import ProductGridSection from '@/components/ProductGridSection';
import SearchModal from '@/components/SearchModal';

export const revalidate = 0;

export default async function Home() {
  let products: Product[] = [];
  try {
    products = await get<Product[]>('/products');
  } catch (err) {
    console.error('Failed to load products:', err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Trust Badges (Wave, OM, Delivery, Craftsmanship) */}
      <TrustBadges />

      {/* 3. Product Grid with Category Filters & 2-column Mobile Layout */}
      <ProductGridSection products={products} />

      {/* 4. Instant Search Modal */}
      <SearchModal products={products} />
    </div>
  );
}
