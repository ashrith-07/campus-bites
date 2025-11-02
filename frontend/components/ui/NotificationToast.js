'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, Package, AlertCircle, Store } from 'lucide-react';
import Link from 'next/link';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const [permission, setPermission] = useState('default');

  // ⭐ Check and request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // ⭐ Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    }
    return Notification.permission;
  };

  useEffect(() => {
    const handleNotification = async (event) => {
      const notification = event.detail;
      const toastId = Date.now();
      
      // Add to toast list
      setToasts(prev => [...prev, { ...notification, toastId }]);

      // ⭐ Show browser notification if permitted
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          showBrowserNotification(notification);
        } else if (Notification.permission === 'default') {
          // Auto-request permission for important notifications
          const perm = await requestNotificationPermission();
          if (perm === 'granted') {
            showBrowserNotification(notification);
          }
        }
      }

      // Auto remove after 6 seconds (increased for better readability)
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== toastId));
      }, 6000);
    };

    window.addEventListener('show-notification', handleNotification);
    return () => window.removeEventListener('show-notification', handleNotification);
  }, []);

  // ⭐ Show native browser notification
  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = notification.type === 'store-status' 
        ? 'Campus Bites Store Update'
        : `Order #${notification.orderId}`;
      
      const options = {
        body: notification.message,
        icon: '/favicon.ico', // You can use your logo here
        badge: '/favicon.ico',
        tag: notification.orderId ? `order-${notification.orderId}` : 'store-status',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      };

      const browserNotif = new Notification(title, options);

      // Handle click on notification
      browserNotif.onclick = () => {
        window.focus();
        if (notification.orderId) {
          window.location.href = `/order-tracking?orderId=${notification.orderId}`;
        }
        browserNotif.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => browserNotif.close(), 5000);
    }
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const getIcon = (notification) => {
    // Store status notifications
    if (notification.type === 'store-status') {
      return <Store className="w-6 h-6 text-secondary" />;
    }

    // Order status notifications
    switch (notification.status) {
      case 'COMPLETED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'READY':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'PROCESSING':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-6 h-6 text-orange-500" />;
      default:
        return <Clock className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getTitle = (notification) => {
    if (notification.type === 'store-status') {
      return 'Store Update';
    }
    return `Order #${notification.orderId}`;
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[60] space-y-3 max-w-[calc(100vw-2rem)] sm:max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className="bg-card border-2 border-border rounded-xl shadow-2xl p-4 animate-slide-in backdrop-blur-sm"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground mb-1 text-sm">
                {getTitle(toast)}
              </p>
              <p className="text-sm text-muted-foreground mb-2 leading-snug">
                {toast.message}
              </p>
              {toast.orderId && (
                <Link
                  href={`/order-tracking?orderId=${toast.orderId}`}
                  className="inline-block text-sm text-secondary hover:underline font-semibold"
                  onClick={() => removeToast(toast.toastId)}
                >
                  View Order →
                </Link>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.toastId)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      ))}

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}