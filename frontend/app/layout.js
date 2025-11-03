import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PusherProvider } from '@/contexts/PusherContext'; // ⭐ Updated import
import Navbar from '@/components/ui/Navbar';
import NotificationToast from '@/components/ui/NotificationToast';

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
          <CartProvider>
            <PusherProvider>
              <Navbar />
              {children}
              <NotificationToast />
            </PusherProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}