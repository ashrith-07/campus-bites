'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, router]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
            Order Placed!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your order has been confirmed successfully
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Order Number</p>
            <p className="text-3xl font-bold text-secondary">#{orderId}</p>
          </div>

          <div className="space-y-4 pt-6 border-t border-border">
            {/* Preparation Time */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Ready in 15-20 minutes</p>
                <p className="text-sm text-muted-foreground">We'll notify you when it's ready</p>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pickup Location</p>
                <p className="text-sm text-muted-foreground">Campus Canteen - Counter #3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={`/order-tracking?orderId=${orderId}`}
            className="w-full bg-secondary text-secondary-foreground py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Track Order
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/"
            className="w-full bg-muted text-foreground py-4 rounded-xl font-semibold text-lg hover:bg-border transition-all flex items-center justify-center"
          >
            Back to Home
          </Link>
        </div>

        {/* Auto Redirect Message */}
        {countdown > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Redirecting to order tracking in {countdown} seconds...
          </p>
        )}
      </div>
    </div>
  );
}