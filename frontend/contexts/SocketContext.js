'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [storeStatus, setStoreStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';

  // ⭐ Polling fallback - checks store status every 10 seconds
  const pollStoreStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/store/status`);
      if (response.ok) {
        const data = await response.json();
        setStoreStatus(data.isOpen);
      }
    } catch (error) {
      console.error('[Poll] Error fetching store status:', error);
    }
  };

  // ⭐ Start polling
  useEffect(() => {
    pollStoreStatus();
    pollingIntervalRef.current = setInterval(pollStoreStatus, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ⭐ Socket Connection
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.IO server
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] ❌ Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // ⭐ Store status updates
    socket.on('store-status', (data) => {
      console.log('[Socket] 🏪 Store status:', data.isOpen);
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
    });

    // ⭐ Order updates
    socket.on('order-update', (data) => {
      console.log('[Socket] 📦 Order update:', data);
      
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
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user, API_URL]);

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

  // ⭐ Emit events to server
  const emitStoreStatusUpdate = (isOpen) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-store-status', { isOpen });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        getOrderUpdate,
        orderUpdates,
        storeStatus,
        updateStoreStatus,
        isConnected,
        emitStoreStatusUpdate
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};