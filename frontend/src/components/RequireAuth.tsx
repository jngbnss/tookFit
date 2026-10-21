"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./providers/Auth";

/**
 * 로그인이 필요한 화면을 감싼다. 토큰 재발급까지 시도한 뒤(AuthProvider) 판단하므로,
 * access 쿠키가 만료된 회원을 로그인 화면으로 잘못 보내지 않는다. 실제 권한 검사는 백엔드가 한다.
 */
export function RequireAuth({ children, role }: { children: ReactNode; role?: "ADMIN" }) {
  const { me, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const allowed = Boolean(me && (!role || me.role === role));

  useEffect(() => {
    if (!ready) return;
    if (!me) {
      const qs = search.toString();
      const target = pathname + (qs ? `?${qs}` : "");
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    } else if (role && me.role !== role) {
      router.replace("/");
    }
  }, [ready, me, role, router, pathname, search]);

  if (!ready || !allowed) {
    return (
      <div className="container page" aria-busy="true">
        <p className="muted">확인하는 중…</p>
      </div>
    );
  }
  return <>{children}</>;
}
