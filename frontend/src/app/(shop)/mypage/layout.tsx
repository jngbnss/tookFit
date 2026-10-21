import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { MyPageNav } from "@/components/mypage/MyPageNav";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "마이페이지", robots: { index: false } };

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <RequireAuth>
        <div className="container page">
          <div className="side-layout">
            <MyPageNav />
            <div style={{ minWidth: 0 }}>{children}</div>
          </div>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
