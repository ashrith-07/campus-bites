'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SSEContext = createContext();

export function SSEProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [storeStatus, setStoreStatus] = useState(true);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';

  // ⭐ Polling function - checks store status every 10 seconds
  const pollStoreStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/store/status`);
      if (response.ok) {
        const data = await response.json();
        setStoreStatus(data.isOpen);
        console.log('[Poll] Store status:', data.isOpen);
      }
    } catch (error) {
      console.error('[Poll] Error fetching store status:', error);
    }
  };

  // ⭐ Start polling when component mounts
  useEffect(() => {
    // Initial fetch
    pollStoreStatus();

    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(pollStoreStatus, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // SSE Connection (enhancement for real-time updates)
  useEffect(() => {
    if (!token || !user) {
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
      return;
    }

    if (!token) {
      console.log('[SSE] No token available');
      return;
    }

    const url = `${API_URL}/notifications/stream?token=${token}`;
    console.log('[SSE] Connecting...');

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('[SSE] ✅ Connected');
    };

    // Store status updates via SSE
    eventSource.addEventListener('store-status', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] 🏪 Store status update:', data.isOpen);
        setStoreStatus(data.isOpen);
        
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
        console.error('[SSE] Error parsing store status:', error);
      }
    });

    // Order updates via SSE
    eventSource.addEventListener('order-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] 📦 Order update:', data);
        
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

        setOrderUpdates(prev => ({
          ...prev,
          [data.orderId]: {
            status: data.status,
            timestamp: new Date()
          }
        }));

        showToast(notification);
      } catch (error) {
        console.error('[SSE] Error parsing order update:', error);
      }
    });

    // Handle general messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected' || data.type === 'store-status') {
          if (typeof data.isOpen !== 'undefined') {
            setStoreStatus(data.isOpen);
          }
        }
      } catch (error) {
        // Heartbeat or unparseable message
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('[SSE] ❌ Connection error');
      eventSource.close();
      eventSourceRef.current = null;
      
      // Don't retry immediately - polling will keep status updated
      reconnectTimeoutRef.current = setTimeout(() => {
        if (token && user) {
          console.log('[SSE] Retrying connection...');
          connectToSSE();
        }
      }, 30000); // Retry after 30 seconds
    };

    eventSourceRef.current = eventSource;
  };

  const showToast = (notification) => {
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
        storeStatus,
        updateStoreStatus
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