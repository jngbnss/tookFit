"use client";

import type { ReactNode } from "react";
import type { StoreSettings } from "@/lib/api/types";
import { AuthProvider } from "./Auth";
import { CartProvider } from "./Cart";
import { SettingsProvider } from "./Settings";
import { ToastProvider } from "./Toast";
import { WishlistProvider } from "./Wishlist";

export function AppProviders({ settings, children }: { settings: StoreSettings; children: ReactNode }) {
  return (
    <SettingsProvider settings={settings}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
