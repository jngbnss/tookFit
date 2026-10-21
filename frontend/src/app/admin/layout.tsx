import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { RequireAuth } from "@/components/RequireAuth";
import { ApiError } from "@/lib/api/client";
import { serverGet } from "@/lib/api/server";
import type { Me } from "@/lib/api/types";

export const metadata: Metadata = { title: { default: "관리자", template: "%s | 관리자" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 서버에서 확실히 판단할 수 있으면 먼저 막는다. 토큰이 만료(401)됐으면 클라이언트가 재발급 후 다시 확인한다.
  try {
    const me = await serverGet<Me>("/me");
    if (me.role !== "ADMIN") redirect("/");
  } catch (e) {
    unstable_rethrow(e); // redirect(), 동적 렌더링 신호는 Next.js에 그대로 넘긴다
    if (!(e instanceof ApiError)) throw e;
  }

  return (
    <Suspense>
      <RequireAuth role="ADMIN">
        <div className="admin">
          <AdminNav />
          <div className="admin-main">{children}</div>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
