import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentFail } from "@/components/checkout/PaymentResult";

export const metadata: Metadata = { title: "결제 실패", robots: { index: false } };

export default function CheckoutFailPage() {
  return (
    <Suspense>
      <PaymentFail />
    </Suspense>
  );
}
