'use client';

import { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugPanel() {
  const { isConnected, testNotification, notifications, unreadCount } = useSocket();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Debug Panel"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-card border-2 border-purple-600 rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">🐛 Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Connection Status */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">Socket Status:</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">User Info:</p>
              <p className="text-xs">ID: {user.id}</p>
              <p className="text-xs">Email: {user.email}</p>
              <p className="text-xs">Role: {user.role}</p>
            </div>

            {/* Notification Stats */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold mb-1">Notifications:</p>
              <p className="text-xs">Total: {notifications.length}</p>
              <p className="text-xs">Unread: {unreadCount}</p>
            </div>

            {/* Test Button */}
            <button
              onClick={testNotification}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              🧪 Test Notification
            </button>

            {/* Instructions */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
              <p className="font-semibold text-yellow-700 mb-1">📝 Testing Steps:</p>
              <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Check socket is connected (green dot)</li>
                <li>Click "Test Notification" button</li>
                <li>Check browser console for logs</li>
                <li>Look for toast notification</li>
                <li>Check bell icon for notification count</li>
              </ol>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold mb-2">Recent Notifications:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {notifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="text-xs bg-card p-2 rounded">
                      <p className="font-medium">Order #{notif.orderId}</p>
                      <p className="text-muted-foreground truncate">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Console Check */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <p className="font-semibold text-blue-700 mb-1">🔍 Check Browser Console</p>
              <p className="text-xs text-blue-700">
                Open DevTools (F12) and look for [Socket] and [Toast] logs
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}