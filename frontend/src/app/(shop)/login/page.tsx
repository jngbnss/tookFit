import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "로그인", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="container page narrow" style={{ maxWidth: 420 }}>
      <h1 className="page-title">로그인</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
