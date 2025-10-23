'use client';
import { Search, Bell, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import  {useCart}  from '@/contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar(){
  const { user } = useAuth();
  const { getCartCount, setShowCart } = useCart();
  const router = useRouter();

  return (
    <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="text-2xl">🍔</div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">Campus Bites</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Open until 9 PM
              </p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for dishes..."
                className="w-full pl-12 pr-4 py-3 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
                  <Bell className="w-6 h-6 text-foreground" />
                </button>
                
                <Link href="/profile" className="p-2 hover:bg-muted rounded-full transition-colors">
                  <User className="w-6 h-6 text-foreground" />
                </Link>

                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-foreground" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-6 py-2 bg-accent text-accent-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>
                
                <button
                  onClick={() => setShowCart(true)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-foreground" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}