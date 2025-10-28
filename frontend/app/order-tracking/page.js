'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSSE } from '@/contexts/SSEContext';

// Content component
function OrderTrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { getOrderUpdate } = useSSE();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }
    fetchOrderDetails();
  }, [orderId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!orderId || !order) return;

    const update = getOrderUpdate(parseInt(orderId));
    if (update && update.status !== order.status) {
      // Update order status in real-time
      setOrder(prev => ({
        ...prev,
        status: update.status
      }));
    }
  }, [getOrderUpdate(parseInt(orderId))]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://campus-bites-server.vercel.app/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch order details');

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError('Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = {
      'PENDING': 1,
      'PROCESSING': 2,
      'READY': 3,
      'COMPLETED': 4,
      'CANCELLED': 0
    };
    return steps[status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Order not found'}</p>
          <Link href="/" className="text-secondary hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Track Order</h1>
              <p className="text-sm text-muted-foreground">Order #{order.id}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Real-time Status Indicator */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
          <p className="text-sm text-foreground">Live tracking enabled - status updates automatically</p>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-2xl p-6 shadow-elegant mb-6 border border-border">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Current Status</p>
            <p className="font-serif text-3xl font-bold text-secondary">
              {order.status}
            </p>
          </div>

          {/* Progress Bar */}
          {!isCancelled && (
            <div className="relative">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Pending</span>
                <span className="text-xs text-muted-foreground">Processing</span>
                <span className="text-xs text-muted-foreground">Ready</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      step <= currentStep 
                        ? 'bg-secondary text-secondary-foreground scale-110' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step <= currentStep ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 transition-all duration-500 ${
                        step < currentStep ? 'bg-secondary' : 'bg-muted'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <p className="text-xl font-semibold text-destructive">Order Cancelled</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl p-6 shadow-elegant mb-6 border border-border">
          <h2 className="font-serif text-xl font-bold mb-4">Order Details</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-semibold text-foreground">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Time:</span>
              <span className="font-semibold text-foreground">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-semibold text-foreground">{order.paymentIntentId}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items
            </h3>
            <div className="space-y-3">
              {order.items && order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.menuItem.imageUrl} 
                      alt={item.menuItem.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span className="text-foreground">Total Amount:</span>
              <span className="text-secondary">₹{parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        {order.status === 'READY' && (
          <div className="bg-success/10 border-2 border-success rounded-2xl p-6 text-center mb-6 animate-pulse">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-success mb-2">Your order is ready!</h3>
            <p className="text-success-foreground">Please collect from Campus Canteen - Counter #3</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link 
            href="/"
            className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-center hover:opacity-90 transition"
          >
            Back to Home
          </Link>
          <button
            onClick={fetchOrderDetails}
            className="flex-1 bg-card text-secondary py-3 rounded-xl font-semibold border-2 border-secondary hover:bg-secondary/5 transition"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}



