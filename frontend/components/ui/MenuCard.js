'use client';
import { Star, Clock, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function MenuCard({ item }) {
  const { addToCart } = useCart();

   if (!item) return null;

  const handleAddToCart = () => {
    addToCart(item);
  };

  return (
    <div className="bg-card rounded-2xl shadow-elegant border border-border overflow-hidden hover:shadow-elegant-lg transition-all duration-300 hover:-translate-y-1">
      <div className="p-6 relative">
        {/* Popular Badge */}
        {item.popular && (
          <div className="absolute top-4 right-4">
            <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Popular
            </span>
          </div>
        )}

        {/* Item Image/Emoji */}
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-muted rounded-full">
          <span className="text-5xl">{item.imageUrl || '🍽️'}</span>
        </div>

        {/* Item Name */}
        <h3 className="font-serif text-xl font-bold text-card-foreground mb-2 text-center">
          {item.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2 min-h-[40px]">
          {item.description || 'Delicious food item'}
        </p>

        {/* Rating & Time */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-medium text-foreground">4.5</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">15 min</span>
          </div>
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            ₹{parseFloat(item.price).toFixed(0)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-secondary text-secondary-foreground px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}