// 브라우저용 API 클라이언트.
// - 같은 출처의 /api/v1 을 부른다 (쿠키 인증)
// - 상태를 바꾸는 요청에는 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 보낸다
// - 401 TOKEN_EXPIRED 이면 /auth/refresh 후 한 번만 재시도한다

import type { ApiErrorBody } from "./types";

export const API_BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message || "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.");
    this.name = "ApiError";
    this.status = status;
    this.code = body.code || (status === 0 ? "NETWORK_ERROR" : "UNKNOWN");
    this.fields = body.fields;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfPromise: Promise<void> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  let token = readCookie("XSRF-TOKEN");
  if (token) return token;
  csrfPromise ??= fetch(`${API_BASE}/auth/csrf`, { credentials: "include" })
    .then(() => undefined)
    .finally(() => {
      csrfPromise = null;
    });
  await csrfPromise;
  token = readCookie("XSRF-TOKEN");
  return token;
}

let refreshPromise: Promise<boolean> | null = null;

/** refresh 토큰으로 access 토큰을 다시 받는다. 동시에 여러 요청이 401을 받아도 refresh는 한 번만 한다. */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await rawRequest("POST", "/auth/refresh");
      return res.ok;
    } catch {
      return false;
    } finally {
      // 기다리던 요청들은 이미 이 promise를 들고 있으므로 바로 비워도 결과를 함께 받는다
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export type QueryValue = string | number | boolean | null | undefined | (string | number)[];

export function toQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
    } else {
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function rawRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (UNSAFE.has(method)) {
    const token = await ensureCsrfToken();
    if (token) headers["X-XSRF-TOKEN"] = token;
  }
  return fetch(API_BASE + path, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parseError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> = {};
  try {
    body = await res.json();
  } catch {
    // 본문이 JSON이 아니면(예: 게이트웨이 오류) 기본 메시지를 쓴다
  }
  return new ApiError(res.status, body);
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await rawRequest(method, path, body);
  } catch {
    throw new ApiError(0, { message: "서버에 연결할 수 없어요. 네트워크를 확인해주세요." });
  }

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const err = await parseError(res);
    if (err.code !== "TOKEN_EXPIRED") throw err;
    if (!(await refreshSession())) throw err;
    res = await rawRequest(method, path, body);
  }

  if (res.status === 403) {
    // CSRF 토큰이 만료되었을 수 있어 새로 받아 한 번 더 시도한다
    const err = await parseError(res);
    if (UNSAFE.has(method) && err.code === "CSRF_INVALID") {
      document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
      res = await rawRequest(method, path, body);
    } else {
      throw err;
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, QueryValue>) => request<T>("GET", path + toQuery(params)),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
