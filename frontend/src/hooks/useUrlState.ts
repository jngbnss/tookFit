"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** 관리자 목록의 필터, 페이지를 URL 쿼리에 둔다 (새로고침, 뒤로가기, 링크 공유가 그대로 동작). */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback((k: string) => params.get(k) ?? "", [params]);
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);

  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>, keepPage = false) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => (v === null || v === undefined || v === "" ? next.delete(k) : next.set(k, String(v))));
      if (!keepPage && !("page" in patch)) next.delete("page");
      const s = next.toString();
      router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
    },
    [params, router, pathname],
  );

  return { get, set, page, key: params.toString() };
}
