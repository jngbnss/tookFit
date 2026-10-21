import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentSuccess } from "@/components/checkout/PaymentResult";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "결제 확인", robots: { index: false } };

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <RequireAuth>
        <PaymentSuccess />
      </RequireAuth>
    </Suspense>
  );
}
