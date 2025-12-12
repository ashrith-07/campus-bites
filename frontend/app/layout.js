"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PusherProvider } from "@/contexts/PusherContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import SandboxBlocker from "@/components/SandboxBlocker";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SandboxBlocker>
          <AuthProvider>
            <CartProvider>
              <PusherProvider>
                <ConditionalLayout>{children} </ConditionalLayout>
              </PusherProvider>
            </CartProvider>
          </AuthProvider>
        </SandboxBlocker>
      </body>
    </html>
  );
}
