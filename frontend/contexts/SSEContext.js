'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SSEContext = createContext();

export function SSEProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [storeStatus, setStoreStatus] = useState(true); // ⭐ Added store status
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      // Disconnect if user logs out
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    // Connect to SSE
    connectToSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [token, user]);

  const connectToSSE = () => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    if (!token) {
      console.log('No token available for SSE connection');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';
    // Pass token as query parameter since EventSource doesn't support headers
    const url = `${apiUrl}/notifications/stream?token=${token}`;

    console.log('Connecting to SSE:', url);

    const eventSource = new EventSource(url);

    // Connection opened
    eventSource.onopen = () => {
      console.log('✅ SSE connection established');
    };

    // ⭐ Listen for store status updates
    eventSource.addEventListener('store-status', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🏪 Store status update:', data.isOpen);
        setStoreStatus(data.isOpen);
        
        // Show toast notification for customers
        if (user?.role !== 'VENDOR') {
          const message = data.isOpen 
            ? '🎉 Store is now open! You can place orders.' 
            : '🔒 Store is now closed. Orders are temporarily unavailable.';
          
          showToast({
            id: Date.now(),
            message,
            timestamp: new Date(),
            type: 'store-status'
          });
        }
      } catch (error) {
        console.error('Error parsing store status:', error);
      }
    });

    // Listen for order updates
    eventSource.addEventListener('order-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📦 Order update received:', data);
        
        // Add notification
        const notification = {
          id: Date.now(),
          orderId: data.orderId,
          status: data.status,
          message: data.message,
          timestamp: new Date(),
          read: false,
          type: 'order-update'
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Update order status for real-time tracking
        setOrderUpdates(prev => ({
          ...prev,
          [data.orderId]: {
            status: data.status,
            timestamp: new Date()
          }
        }));

        // Show toast notification
        showToast(notification);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    });

    // Handle general messages (including connection confirmation)
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message:', data);
        
        // Handle initial store status
        if (data.type === 'connected' || data.type === 'store-status') {
          if (typeof data.isOpen !== 'undefined') {
            setStoreStatus(data.isOpen);
          }
        }
      } catch (error) {
        console.log('SSE heartbeat');
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error');
      eventSource.close();
      eventSourceRef.current = null;
      
      // Retry connection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (token && user) {
          console.log('Retrying SSE connection...');
          connectToSSE();
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  const showToast = (notification) => {
    // Create a custom event that a Toast component can listen to
    const event = new CustomEvent('show-notification', { detail: notification });
    window.dispatchEvent(event);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getOrderUpdate = (orderId) => {
    return orderUpdates[orderId] || null;
  };

  // ⭐ Add function to update store status (for vendor)
  const updateStoreStatus = (newStatus) => {
    setStoreStatus(newStatus);
  };

  return (
    <SSEContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        getOrderUpdate,
        orderUpdates,
        storeStatus,        // ⭐ Export store status
        updateStoreStatus   // ⭐ Export update function
      }}
    >
      {children}
    </SSEContext.Provider>
  );
}

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within SSEProvider');
  }
  return context;
};