'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSSE } from '@/contexts/SSEContext';
import { Package, ChefHat, BarChart3, LogOut } from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();
  const { storeStatus, updateStoreStatus } = useSSE(); // ⭐ Use SSE context
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user && user.role !== 'VENDOR') {
      router.push('/');
      return;
    }
  }, [token, user, authLoading, router]);

  const toggleStoreStatus = async () => {
    const newStatus = !storeStatus;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';
      
      // ⭐ Send to backend which broadcasts via SSE
      const response = await fetch(`${API_URL}/notifications/store-status?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isOpen: newStatus })
      });

      if (response.ok) {
        // ⭐ Update local state
        updateStoreStatus(newStatus);
        console.log('✅ Store status updated:', newStatus);
      } else {
        const error = await response.json();
        console.error('❌ Failed to update store status:', error);
        alert('Failed to update store status');
      }
    } catch (error) {
      console.error('❌ Error updating store status:', error);
      alert('Failed to update store status');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'VENDOR') return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Store Status Toggle */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Vendor Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your orders, menu items, and track status</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Store Status Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                <span className="text-sm font-semibold">Store:</span>
                <button
                  onClick={toggleStoreStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    storeStatus ? 'bg-success' : 'bg-destructive'
                  }`}
                  title={storeStatus ? 'Click to close store' : 'Click to open store'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      storeStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-bold ${storeStatus ? 'text-success' : 'text-destructive'}`}>
                  {storeStatus ? 'Open' : 'Closed'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'menu'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ChefHat className="w-5 h-5" />
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'status'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Status
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && <OrdersManagement token={token} />}
        {activeTab === 'menu' && <MenuManagement token={token} />}
        {activeTab === 'status' && <StatusOverview token={token} />}
      </div>
    </div>
  );
}

// [Keep your existing OrdersManagement, MenuManagement, and StatusOverview components exactly as they are]
// I'm not repeating them here to save space, but keep all three components unchanged