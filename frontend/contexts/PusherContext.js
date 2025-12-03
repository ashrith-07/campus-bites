'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

const PusherContext = createContext();

export function PusherProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [storeStatus, setStoreStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-bites-server.vercel.app/api';

 
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

  
  useEffect(() => {
    pollStoreStatus();
    pollingIntervalRef.current = setInterval(pollStoreStatus, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    if (!token || !user) {
      console.log('[Pusher] ⚠️ No token or user, skipping connection');
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      return;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true
    });

    pusherRef.current = pusher;

  
    pusher.connection.bind('connected', () => {
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[Pusher] ❌ Disconnected');
      setIsConnected(false);
    });

    pusher.connection.bind('error', (error) => {
      console.error('[Pusher] ⚠️ Connection error:', error);
      setIsConnected(false);
    });

  
    const userChannel = pusher.subscribe(`user-${user.id}`);
    
    userChannel.bind('pusher:subscription_succeeded', () => {
      console.log(`[Pusher] ✅ Subscribed to user-${user.id}`);
    });

    userChannel.bind('order-update', (data) => {
      
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
        return [notification, ...prev];
      });
      
      setUnreadCount(prev => {
        const newCount = prev + 1;
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

    
    const storeChannel = pusher.subscribe('store-updates');
    
    storeChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Subscribed to store-updates');
    });

    storeChannel.bind('store-status', (data) => {
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

  
    return () => {
      console.log('[Pusher] 🔌 Disconnecting...');
      if (pusher) {
        pusher.unsubscribe(`user-${user.id}`);
        pusher.unsubscribe('store-updates');
        pusher.disconnect();
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
    setNotifications([]);
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
    <PusherContext.Provider
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
        testNotification
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}

export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within PusherProvider');
  }
  return context;
};


export const useSocket = usePusher;