'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const SSEContext = createContext();

export function SSEProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState({});
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      // Disconnect if user logs out
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
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
    };
  }, [token, user]);

  const connectToSSE = () => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${apiUrl}/orders/stream`;

    console.log('Connecting to SSE:', url);

    const eventSource = new EventSource(url, {
      withCredentials: false,
    });

    // Connection opened
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    // Listen for order updates
    eventSource.addEventListener('order_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Order update received:', data);
        
        // Add notification
        const notification = {
          id: Date.now(),
          orderId: data.orderId,
          status: data.status,
          message: data.message,
          timestamp: new Date(),
          read: false
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

    // Handle general messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message:', data);
      } catch (error) {
        console.log('SSE heartbeat or info message');
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      eventSourceRef.current = null;
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        if (token && user) {
          connectToSSE();
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  const showToast = (notification) => {
    // We'll create a custom event that a Toast component can listen to
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

  return (
    <SSEContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        getOrderUpdate,
        orderUpdates
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