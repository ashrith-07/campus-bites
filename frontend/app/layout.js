import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import './globals.css'

export const metadata = {
  title: 'Campus Bites - Elevated Campus Dining',
  description: 'Order from anywhere on campus, pick up fresh when ready',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}