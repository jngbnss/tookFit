import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "비밀번호 찾기", robots: { index: false } };

export default function ForgotLayout({ children }: { children: ReactNode }) {
  return children;
}
