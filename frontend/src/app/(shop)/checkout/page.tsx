import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "주문서", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense>
      <RequireAuth>
        <CheckoutView />
      </RequireAuth>
    </Suspense>
  );
}
