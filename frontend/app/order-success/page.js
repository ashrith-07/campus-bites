// frontend/app/order-success/page.js
'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('📍 Order Success Page mounted');
    console.log('📍 orderId from URL:', orderId);
    console.log('📍 Full URL:', window.location.href);
    
    // Only fetch if we have an orderId
    if (orderId) {
      fetchOrderDetails();
    } else {
      console.error('❌ No orderId in URL');
      setError('No order ID provided');
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';
      
      console.log('📡 Fetching order details for ID:', orderId);
      
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      console.log('✅ Order details loaded:', data.order);
      setOrder(data.order);
    } catch (err) {
      console.error('❌ Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
          {orderId && <p className="text-xs text-muted-foreground mt-2">Order #{orderId}</p>}
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Unable to Load Order</h2>
          <p className="text-destructive mb-4">{error || 'Order not found'}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Order ID: {orderId || 'Not provided'}
          </p>
          <Link 
            href="/" 
            className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show success state
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Icon */}
        <div className="bg-card rounded-2xl p-8 text-center mb-6 shadow-elegant border border-border">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-4">Thank you for your order</p>
          <div className="inline-block bg-secondary/10 px-4 py-2 rounded-lg">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="text-xl font-bold text-secondary">#{order.id}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl p-6 shadow-elegant mb-6 border border-border">
          <h2 className="font-serif text-lg font-semibold mb-4">Order Details</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-secondary capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Time:</span>
              <span className="font-medium text-foreground">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-medium text-foreground text-xs">{order.paymentIntentId}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items && order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {item.menuItem.imageUrl && (
                      <div className="w-12 h-12 rounded flex items-center justify-center bg-muted">
                        <span className="text-2xl">{item.menuItem.imageUrl}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-foreground">₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">Total Amount:</span>
              <span className="text-secondary">₹{parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link 
            href={`/order-tracking?orderId=${order.id}`}
            className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-center hover:opacity-90 transition"
          >
            Track Order
          </Link>
          <Link 
            href="/"
            className="flex-1 bg-card text-secondary py-3 rounded-xl font-semibold text-center border-2 border-secondary hover:bg-secondary/5 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}