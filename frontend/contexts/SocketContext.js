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
      console.log('[Socket] ⚠️ No token or user, skipping connection');
      console.log('[Socket] Token exists:', !!token);
      console.log('[Socket] User exists:', !!user);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // ⭐ Get base URL without /api for socket connection
    const SOCKET_URL = API_URL.replace('/api', '');
    
    console.log('[Socket] 🔌 Attempting connection...');
    console.log('[Socket] URL:', SOCKET_URL);
    console.log('[Socket] 👤 User ID:', user.id);
    console.log('[Socket] 👤 Email:', user.email);
    console.log('[Socket] 👤 Role:', user.role);
    console.log('[Socket] 🔑 Token (first 20 chars):', token?.substring(0, 20) + '...');

    // Connect to Socket.IO server
    const socket = io(SOCKET_URL, {
      auth: { token }, // ⭐ Pass the token for authentication
      transports: ['websocket', 'polling'], // Try WebSocket first
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      upgrade: true,
      rememberUpgrade: true,
      autoConnect: true // ⭐ Ensure auto-connect is enabled
    });

    socketRef.current = socket;

    // ⭐ Connection events with detailed logging
    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully!');
      console.log('[Socket] ID:', socket.id);
      console.log('[Socket] Transport:', socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Disconnected. Reason:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] ⚠️ Connection error:', error.message);
      console.error('[Socket] Error details:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('[Socket] ⚠️ Socket error:', error);
    });

    // ⭐ Store status updates
    socket.on('store-status', (data) => {
      console.log('[Socket] 🏪 Store status update received:', data);
      setStoreStatus(data.isOpen);

      if (user?.role !== 'VENDOR') {
        const message = data.isOpen 
          ? '🎉 Store is now open! You can place orders.' 
          : '🔒 Store is now closed. Orders are temporarily unavailable.';
        
        const notification = {
          id: Date.now(),
          message,
          timestamp: new Date(),
          type: 'store-status',
          read: false
        };
        
        setNotifications(prev => [notification, ...prev]);
        showToast(notification);
      }
    });

    // ⭐ Order updates with detailed logging
    socket.on('order-update', (data) => {
      console.log('[Socket] 📦 Order update received:', data);
      
      const notification = {
        id: Date.now(),
        orderId: data.orderId,
        status: data.status,
        message: data.message,
        timestamp: new Date(),
        read: false,
        type: 'order-update'
      };

      setNotifications(prev => {
        console.log('[Socket] 📋 Adding notification. Total:', prev.length + 1);
        return [notification, ...prev];
      });
      
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('[Socket] 🔔 Unread count:', newCount);
        return newCount;
      });

      setOrderUpdates(prev => ({
        ...prev,
        [data.orderId]: {
          status: data.status,
          timestamp: new Date()
        }
      }));

      showToast(notification);
    });

    // ⭐ Debug: Log all events
    socket.onAny((eventName, ...args) => {
      console.log('[Socket] 📨 Event received:', eventName, args);
    });

    // Cleanup
    return () => {
      console.log('[Socket] 🔌 Disconnecting socket...');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user, API_URL]);

  const showToast = (notification) => {
    console.log('[Toast] 🍞 Showing toast:', notification);
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
      console.log('[Socket] 📤 Emitting store status update:', isOpen);
      socketRef.current.emit('update-store-status', { isOpen });
    } else {
      console.error('[Socket] ⚠️ Cannot emit - socket not connected');
    }
  };

  // ⭐ Debug function to test notifications
  const testNotification = () => {
    const testNotif = {
      id: Date.now(),
      orderId: 999,
      status: 'READY',
      message: '🧪 Test notification - Your order is ready!',
      timestamp: new Date(),
      read: false,
      type: 'order-update'
    };
    
    setNotifications(prev => [testNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToast(testNotif);
    
    console.log('[Debug] 🧪 Test notification sent!');
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
        emitStoreStatusUpdate,
        testNotification // ⭐ Add test function
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