'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const notification = event.detail;
      const toastId = Date.now();
      
      setToasts(prev => [...prev, { ...notification, toastId }]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
      }, 5000);
    };

    window.addEventListener('show-notification', handleNotification);
    return () => window.removeEventListener('show-notification', handleNotification);
  }, []);

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const getIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'READY':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'PROCESSING':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Clock className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="bg-card border border-border rounded-xl shadow-elegant-lg p-4 animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon(toast.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground mb-1">Order Update</p>
              <p className="text-sm text-muted-foreground mb-2">{toast.message}</p>
              <Link
                href={`/order-tracking?orderId=${toast.orderId}`}
                className="text-sm text-secondary hover:underline font-semibold"
                onClick={() => removeToast(toast.toastId)}
              >
                View Order →
              </Link>
            </div>
            <button
              onClick={() => removeToast(toast.toastId)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}