import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SSEProvider } from '@/contexts/SSEContext';
import NotificationToast from '@/components/ui/NotificationToast';
import './globals.css';

export const metadata = {
  title: 'Campus Bites',
  description: 'Elevated Campus Dining',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <SSEProvider>
              {children}
              <NotificationToast />
            </SSEProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}