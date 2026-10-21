import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <div className="container page narrow" style={{ maxWidth: 420 }}>
      <h1 className="page-title">비밀번호 재설정</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
