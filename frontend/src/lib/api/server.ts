import "server-only";

import { cookies } from "next/headers";
import { notFound, unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { normalizeSettings } from "../settings";
import { ApiError, toQuery, type QueryValue } from "./client";
import type { ApiErrorBody, StoreSettings } from "./types";

// 서버 컴포넌트에서 백엔드를 직접 부른다. 요청 시점의 환경변수와 쿠키를 쓰므로 이 함수를 쓰는 페이지는 항상 동적 렌더링된다.
function apiUrl() {
  return (process.env.INTERNAL_API_URL ?? "http://localhost:8081") + "/api/v1";
}

export async function serverGet<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
  let res: Response;
  try {
    res = await fetch(apiUrl() + path + toQuery(params), {
      headers: { Accept: "application/json", ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, { message: "서버에 연결할 수 없어요." });
  }
  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = await res.json();
    } catch {
      // 본문이 JSON이 아니면 기본 메시지를 쓴다
    }
    throw new ApiError(res.status, body);
  }
  return (await res.json()) as T;
}

/** 404면 Next.js의 not-found 페이지를 보여준다. */
export async function serverGetOr404<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  try {
    return await serverGet<T>(path, params);
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

/** 실패해도 화면을 그릴 수 있는 부가 데이터(배너, 추천 등)용. */
export async function serverGetOr<T>(path: string, fallback: T, params?: Record<string, QueryValue>): Promise<T> {
  try {
    return await serverGet<T>(path, params);
  } catch (e) {
    // cookies() 등 Next.js 내부 신호(동적 렌더링 전환)는 삼키지 않는다
    unstable_rethrow(e);
    return fallback;
  }
}

/** 한 요청 안에서 여러 레이아웃이 불러도 한 번만 가져온다. */
export const getStoreSettings = cache(async () => normalizeSettings(await serverGetOr<StoreSettings | null>("/store/settings", null)));

/** 운영 도메인. 빌드에 굽지 않고 요청 시점의 SITE_URL을 읽는다. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
