import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "회원가입", robots: { index: false } };

export default function SignupPage() {
  return (
    <div className="container page narrow" style={{ maxWidth: 480 }}>
      <h1 className="page-title">회원가입</h1>
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
