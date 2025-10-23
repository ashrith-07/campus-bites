import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css'

export const metadata = {
  title: 'Campus Bites - Elevated Campus Dining',
  description: 'Order from anywhere on campus, pick up fresh when ready',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}