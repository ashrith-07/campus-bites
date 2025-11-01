'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Clock, Lock, MapPin } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, token, loading: authLoading } = useAuth();
  const [paymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (cart.length === 0) {
      router.push('/');
      return;
    }

    setInitializing(false);
  }, [token, cart, router, authLoading]);

  if (authLoading || initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!token || cart.length === 0) {
    return null;
  }

  const subtotal = getCartTotal();
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';
      
      console.log('Starting checkout...');

      // Step 1: Create checkout (get mock payment order)
      const checkoutResponse = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalAmount: total,
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        })
      });

      const contentType = checkoutResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await checkoutResponse.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const checkoutData = await checkoutResponse.json();
      console.log('Checkout response:', checkoutData);

      // ⭐ Step 2: Simulate payment (2 second delay for realism)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ⭐ Generate mock payment credentials
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockSignature = `sig_${Math.random().toString(36).substr(2, 16)}`;

      console.log('Mock payment completed:', mockPaymentId);

      // Step 3: Confirm order with mock payment
      const confirmResponse = await fetch(`${API_URL}/orders/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalAmount: total,
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          paymentId: mockPaymentId,
          orderId: checkoutData.orderId,
          signature: mockSignature
        })
      });

      const confirmContentType = confirmResponse.headers.get('content-type');
      if (!confirmContentType || !confirmContentType.includes('application/json')) {
        const text = await confirmResponse.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Failed to confirm order');
      }

      const confirmData = await confirmResponse.json();
      console.log('Order confirmed:', confirmData);

      // Clear cart and redirect
      clearCart();
      router.replace(`/order-success?orderId=${confirmData.order.id}`);
      
    } catch (error) {
      console.error('Order placement error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Checkout</h1>
              <p className="text-sm text-muted-foreground">Complete your order</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground">
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-bold text-xl text-foreground">Total Amount</span>
                  <span className="font-bold text-3xl text-secondary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pickup Details Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <h2 className="font-serif text-xl font-bold text-foreground mb-6">
                Pickup Details
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Ready for pickup in</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-secondary" />
                    <span className="text-2xl font-bold text-foreground">15-20 minutes</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Pickup Location</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Campus Canteen - Counter #3</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll receive a notification when your order is ready
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Method */}
          <div className="space-y-6">
            {/* Payment Method Card */}
            <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Razorpay Option */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      readOnly
                      className="w-5 h-5 text-secondary accent-secondary"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Pay on Pickup</p>
                        <p className="text-xs text-muted-foreground">Cash or Card at counter</p>
                      </div>
                    </div>
                  </div>
                  <span className="bg-secondary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 bg-secondary text-secondary-foreground py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </span>
                ) : (
                  `Place Order - ₹${total.toFixed(2)}`
                )}
              </button>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Secure ordering system</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}