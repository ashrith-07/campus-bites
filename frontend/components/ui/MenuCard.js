'use client';
import { useCart } from '@/contexts/CartContext';
import { Star, Clock, Plus } from 'lucide-react';
import Image from 'next/image';

export default function MenuCard({ item }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
        <Image 
          src={item.imageUrl} 
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          onError={(e) => {
            e.target.src = '/placeholder-food.jpg'; // Add a placeholder image
          }}
        />
        {item.popular && (
          <span className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-secondary text-secondary-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-full z-10">
            Popular
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-serif text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 h-8 sm:h-10">
          {item.description}
        </p>

        {/* Rating & Time */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-secondary text-secondary" />
            <span className="font-semibold">4.5</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>15 min</span>
          </div>
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg sm:text-2xl text-secondary">
            ₹{parseFloat(item.price).toFixed(0)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-secondary text-secondary-foreground p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}