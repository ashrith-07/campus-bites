import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SocketProvider } from '@/contexts/SocketContext'; // ⭐ Changed from SSEProvider

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
          <SocketProvider> {/* ⭐ Changed from SSEProvider */}
            <CartProvider>
              {children}
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}