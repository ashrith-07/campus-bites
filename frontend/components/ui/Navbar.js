'use client';
import { Search, Bell, ShoppingCart, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSSE } from '@/contexts/SSEContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const { getCartCount, setShowCart } = useCart();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useSSE();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ⭐ Refs for click outside detection
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ⭐ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⭐ Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-xl sm:text-2xl">🍔</div>
              <div className="hidden sm:block">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-foreground">Campus Bites</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  Open until 9 PM
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="font-serif text-base font-bold text-foreground">Campus Bites</h1>
              </div>
            </Link>

            {/* Search Bar - Desktop Only (Hide for vendors) */}
            {user?.role !== 'VENDOR' && (
              <div className="hidden md:flex flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for dishes..."
                    className="w-full pl-12 pr-4 py-3 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  />
                </form>
              </div>
            )}

            {/* Right Side Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  {/* Vendor Dashboard Button - Desktop */}
                  {user.role === 'VENDOR' && (
                    <Link
                      href="/vendor"
                      className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Vendor Dashboard
                    </Link>
                  )}

                  {/* Mobile Menu Toggle */}
                  <button 
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Toggle menu"
                  >
                    {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>

                  {/* Desktop Icons - Only for Customers */}
                  {user.role !== 'VENDOR' && (
                    <div className="hidden md:flex items-center gap-4">
                      {/* ⭐ Notifications Dropdown */}
                      <div className="relative" ref={notificationRef}>
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="relative p-2 hover:bg-muted rounded-full transition-colors"
                          title="Notifications"
                        >
                          <Bell className="w-6 h-6 text-foreground" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-elegant-lg max-h-96 overflow-y-auto z-50">
                            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
                              <h3 className="font-semibold text-foreground">Notifications</h3>
                              {notifications.length > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-xs text-secondary hover:underline"
                                >
                                  Mark all as read
                                </button>
                              )}
                            </div>
                            
                            <div className="divide-y divide-border">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                  No notifications yet
                                </div>
                              ) : (
                                notifications.slice(0, 5).map((notification) => (
                                  <Link
                                    key={notification.id}
                                    href={`/order-tracking?orderId=${notification.orderId}`}
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      setShowNotifications(false);
                                    }}
                                    className={`block p-4 hover:bg-muted transition-colors ${
                                      !notification.read ? 'bg-secondary/5' : ''
                                    }`}
                                  >
                                    <p className="font-medium text-foreground text-sm mb-1">
                                      Order #{notification.orderId}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(notification.timestamp).toLocaleTimeString()}
                                    </p>
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        title="Profile"
                      >
                        <User className="w-6 h-6 text-foreground" />
                      </Link>
                    </div>
                  )}

                  {/* Cart - Only for Customers */}
                  {user.role !== 'VENDOR' && (
                    <button
                      onClick={() => setShowCart(true)}
                      className="relative p-2 hover:bg-muted rounded-full transition-colors"
                      title="Cart"
                    >
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                      {getCartCount() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {getCartCount()}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Profile Icon for Vendors on Desktop */}
                  {user.role === 'VENDOR' && (
                    <Link 
                      href="/profile" 
                      className="hidden md:block p-2 hover:bg-muted rounded-full transition-colors"
                      title="Profile"
                    >
                      <User className="w-6 h-6 text-foreground" />
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="px-4 sm:px-6 py-2 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
                  >
                    Sign In
                  </button>
                  
                  <button
                    onClick={() => setShowCart(true)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    title="Cart"
                  >
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar - Only for Customers */}
          {user?.role !== 'VENDOR' && (
            <div className="md:hidden mt-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for dishes..."
                  className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-secondary transition-all text-sm"
                />
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ⭐ Mobile Menu - Full Screen Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Content */}
          <div 
            ref={mobileMenuRef}
            className="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-card shadow-elegant-lg animate-slide-in"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-lg">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {user?.role === 'VENDOR' ? (
                    <>
                      <Link 
                        href="/vendor"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Vendor Dashboard</span>
                      </Link>
                      <Link 
                        href="/profile"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/profile"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                      <Link
                        href="/order-tracking"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Bell className="w-5 h-5" />
                        <span className="font-medium">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}