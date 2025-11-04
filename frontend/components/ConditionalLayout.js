'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/PusherContext';
import Navbar from '@/components/ui/Navbar';
import NotificationToast from '@/components/ui/NotificationToast';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { storeStatus } = useSocket();

  // Pages that should never show navbar
  const noNavbarPages = [
    '/auth/login',
    '/auth/signup',
    '/order-tracking',
    '/checkout',
    '/order-success'
  ];

  // Check if current page should hide navbar
  const shouldHideNavbar = noNavbarPages.some(page => pathname?.startsWith(page));

  // Hide navbar if:
  // 1. On a no-navbar page
  // 2. Store is closed and user is a customer (not vendor) and on home page
  const showNavbar = !shouldHideNavbar && !(
    !storeStatus && 
    user?.role !== 'VENDOR' && 
    pathname === '/'
  );

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      <NotificationToast />
    </>
  );
}