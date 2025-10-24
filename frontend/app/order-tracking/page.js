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

// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { ArrowLeft, Clock, CheckCircle, Package, Truck } from 'lucide-react';
// import { api } from '@/lib/api';

// export default function OrderTrackingPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const orderId = searchParams.get('orderId');
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (!orderId) {
//       router.push('/');
//       return;
//     }

//     fetchOrder();
//   }, [orderId]);

//   const fetchOrder = async () => {
//     try {
//       setLoading(true);
//       const response = await api.getOrder(orderId);
//       setOrder(response.order || response);
//     } catch (err) {
//       setError('Failed to load order details');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Loading order details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !order) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center px-4">
//         <div className="text-center">
//           <p className="text-destructive mb-4">{error || 'Order not found'}</p>
//           <button
//             onClick={() => router.push('/')}
//             className="px-6 py-2 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:opacity-90"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const statusSteps = [
//     { key: 'PENDING', label: 'Order Placed', icon: CheckCircle },
//     { key: 'PROCESSING', label: 'Preparing', icon: Package },
//     { key: 'READY', label: 'Ready for Pickup', icon: Truck },
//     { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
//   ];

//   const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
//         <div className="max-w-3xl mx-auto px-6 py-4">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={() => router.push('/')}
//               className="p-2 hover:bg-muted rounded-full transition-colors"
//             >
//               <ArrowLeft className="w-6 h-6" />
//             </button>
//             <div>
//               <h1 className="font-serif text-2xl font-bold text-foreground">Order Tracking</h1>
//               <p className="text-sm text-muted-foreground">Order #{orderId}</p>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-3xl mx-auto px-6 py-8">
//         {/* Order Status */}
//         <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border mb-6">
//           <h2 className="font-serif text-xl font-bold text-foreground mb-6">Order Status</h2>
          
//           <div className="space-y-4">
//             {statusSteps.map((step, index) => {
//               const Icon = step.icon;
//               const isCompleted = index <= currentStepIndex;
//               const isCurrent = index === currentStepIndex;
              
//               return (
//                 <div key={step.key} className="flex items-center gap-4">
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                     isCompleted ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
//                   }`}>
//                     <Icon className="w-5 h-5" />
//                   </div>
//                   <div className="flex-1">
//                     <p className={`font-semibold ${isCurrent ? 'text-secondary' : 'text-foreground'}`}>
//                       {step.label}
//                     </p>
//                     {isCurrent && (
//                       <p className="text-sm text-muted-foreground">In progress...</p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Order Items */}
//         <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border">
//           <h2 className="font-serif text-xl font-bold text-foreground mb-4">Order Items</h2>
//           <div className="space-y-3">
//             {order.items?.map((item) => (
//               <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
//                 <div>
//                   <p className="font-semibold text-foreground">{item.menuItem.name}</p>
//                   <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
//                 </div>
//                 <p className="font-semibold text-foreground">
//                   ₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}
//                 </p>
//               </div>
//             ))}
//             <div className="pt-3 border-t-2 border-border flex justify-between items-center">
//               <p className="font-bold text-lg">Total</p>
//               <p className="font-bold text-2xl text-secondary">₹{parseFloat(order.total).toFixed(2)}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }