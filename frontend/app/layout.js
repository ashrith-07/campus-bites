import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SocketProvider } from '@/contexts/SocketContext';
import NotificationToast from '@/components/ui/NotificationToast';
import DebugPanel from '@/components/ui/DebugPanel'; // ⭐ Add debug panel

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Campus Bites',
  description: 'Order delicious food on campus',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              {children}
              {/* ⭐ Global components */}
              <NotificationToast />
              <DebugPanel /> {/* ⭐ Debug panel for testing */}
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}