'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import MenuCard from '@/components/ui/MenuCard';
import CartSidebar from '@/components/ui/CartSidebar';
import { api } from '@/lib/api';

const categories = ['All', 'Pizza', 'Rolls', 'Beverages', 'Desserts', 'Sandwiches', 'Snacks'];

export default function HomePage() {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await api.getMenuItems();
      setMenuItems(data);
    } catch (err) {
      setError('Failed to load menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted to-background py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl font-bold text-foreground mb-4">
            Elevated Campus Dining
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Order from anywhere on campus, pick up fresh when ready
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-secondary text-secondary-foreground shadow-lg scale-105'
                  : 'bg-muted text-foreground hover:bg-border'
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
            <p className="text-muted-foreground text-lg">No items found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Cart Sidebar */}
      <CartSidebar/>
    </div>
  );
}

