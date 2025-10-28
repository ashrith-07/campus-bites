'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import MenuCard from '@/components/ui/MenuCard';
import CartSidebar from '@/components/ui/CartSidebar';
import StoreClosed from '@/components/ui/StoreClosed';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function HomeContent() {
  const categories = ['All', 'Pizza', 'Rolls', 'Beverages', 'Desserts', 'Sandwiches', 'Snacks'];
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { user } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    // Check store status
    const savedStatus = localStorage.getItem('storeOpen');
    if (savedStatus !== null) {
      setStoreOpen(JSON.parse(savedStatus));
    }

    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await api.getMenuItems();
      const formatted = data.map(item => ({
        ...item,
        image: item.image?.startsWith('http')
          ? item.image
          : `${process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api/'}${item.image}`,
      }));
      setMenuItems(formatted);
    } catch (err) {
      setError('Failed to load menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If store is closed and user is not a vendor, show closed page
  if (!storeOpen && user?.role !== 'VENDOR') {
    return <StoreClosed />;
  }

  // Filter by category and search query
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted to-background py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl font-bold text-foreground mb-4">
            Elevated Campus Dining
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Order from anywhere on campus, pick up fresh when ready
          </p>
          {searchQuery && (
            <p className="mt-4 text-secondary font-semibold">
              Showing results for: "{searchQuery}"
            </p>
          )}
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-secondary text-secondary-foreground shadow-lg scale-105'
                  : 'bg-card text-foreground hover:bg-muted border border-border'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Menu Items Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading delicious items...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? `No items found for "${searchQuery}"`
                : 'No items found in this category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
