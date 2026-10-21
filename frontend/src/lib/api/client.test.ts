import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, toQuery } from "./client";

type Call = { url: string; init: RequestInit };

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  let calls: Call[];
  let responder: (call: Call) => Response | Promise<Response>;

  beforeEach(() => {
    calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit = {}) => {
        const call = { url, init };
        calls.push(call);
        return responder(call);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET은 CSRF 헤더 없이 쿠키를 포함해 보낸다", async () => {
    responder = () => json(200, { ok: true });
    await expect(api.get("/products", { page: 0, sizes: ["M", "L"], q: "" })).resolves.toEqual({ ok: true });
    expect(calls[0].url).toBe("/api/v1/products?page=0&sizes=M%2CL");
    expect(calls[0].init.credentials).toBe("include");
    expect((calls[0].init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBeUndefined();
  });

  it("상태를 바꾸는 요청에는 XSRF-TOKEN 쿠키 값을 헤더로 보낸다", async () => {
    document.cookie = "XSRF-TOKEN=abc123; path=/";
    responder = () => json(200, {});
    await api.post("/me/cart/items", { variantId: 1, quantity: 1 });
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["X-XSRF-TOKEN"]).toBe("abc123");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(calls[0].init.body).toBe(JSON.stringify({ variantId: 1, quantity: 1 }));
  });

  it("CSRF 쿠키가 없으면 먼저 /auth/csrf로 받아온다", async () => {
    responder = ({ url }) => {
      if (url === "/api/v1/auth/csrf") {
        document.cookie = "XSRF-TOKEN=fresh; path=/";
        return new Response(null, { status: 204 });
      }
      return json(200, {});
    };
    await api.post("/orders/preview", { items: [] });
    expect(calls.map((c) => c.url)).toEqual(["/api/v1/auth/csrf", "/api/v1/orders/preview"]);
    expect((calls[1].init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("fresh");
  });

  it("401 TOKEN_EXPIRED면 refresh 후 한 번만 다시 시도한다", async () => {
    document.cookie = "XSRF-TOKEN=t; path=/";
    let meCalls = 0;
    responder = ({ url }) => {
      if (url === "/api/v1/auth/refresh") return new Response(null, { status: 204 });
      meCalls++;
      return meCalls === 1 ? json(401, { code: "TOKEN_EXPIRED", message: "만료" }) : json(200, { id: 1 });
    };
    await expect(api.get("/me")).resolves.toEqual({ id: 1 });
    expect(calls.map((c) => c.url)).toEqual(["/api/v1/me", "/api/v1/auth/refresh", "/api/v1/me"]);
  });

  it("동시에 여러 요청이 만료되어도 refresh는 한 번만 한다", async () => {
    document.cookie = "XSRF-TOKEN=t; path=/";
    let refreshed = false;
    responder = async ({ url }) => {
      if (url === "/api/v1/auth/refresh") {
        await new Promise((r) => setTimeout(r, 10));
        refreshed = true;
        return new Response(null, { status: 204 });
      }
      return refreshed ? json(200, { url }) : json(401, { code: "TOKEN_EXPIRED" });
    };
    const [a, b] = await Promise.all([api.get("/me"), api.get("/me/cart")]);
    expect(a).toEqual({ url: "/api/v1/me" });
    expect(b).toEqual({ url: "/api/v1/me/cart" });
    expect(calls.filter((c) => c.url === "/api/v1/auth/refresh")).toHaveLength(1);
  });

  it("refresh도 실패하면 원래 401 오류를 던진다", async () => {
    document.cookie = "XSRF-TOKEN=t; path=/";
    responder = ({ url }) =>
      url === "/api/v1/auth/refresh" ? json(401, { code: "UNAUTHORIZED" }) : json(401, { code: "TOKEN_EXPIRED", message: "만료" });
    const err = (await api.get("/me").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("TOKEN_EXPIRED");
    expect(calls.filter((c) => c.url === "/api/v1/me")).toHaveLength(1);
  });

  it("다른 401(UNAUTHORIZED)은 refresh하지 않는다", async () => {
    responder = () => json(401, { code: "UNAUTHORIZED", message: "로그인이 필요해요." });
    await expect(api.get("/me")).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED", message: "로그인이 필요해요." });
    expect(calls).toHaveLength(1);
  });

  it("에러 응답의 code, message, fields를 그대로 전달한다", async () => {
    document.cookie = "XSRF-TOKEN=t; path=/";
    responder = () => json(409, { code: "OUT_OF_STOCK", message: "재고가 부족해요.", fields: { quantity: "최대 2개" } });
    await expect(api.post("/orders", {})).rejects.toMatchObject({ status: 409, code: "OUT_OF_STOCK", fields: { quantity: "최대 2개" } });
  });

  it("204 응답은 undefined를 돌려준다", async () => {
    document.cookie = "XSRF-TOKEN=t; path=/";
    responder = () => new Response(null, { status: 204 });
    await expect(api.delete("/me/wishlist/3")).resolves.toBeUndefined();
  });

  it("네트워크 오류는 NETWORK_ERROR로 바꾼다", async () => {
    responder = () => {
      throw new TypeError("fetch failed");
    };
    await expect(api.get("/categories")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});

describe("toQuery", () => {
  it("빈 값은 빼고 배열은 쉼표로 잇는다", () => {
    expect(toQuery({ a: 1, b: undefined, c: null, d: "", e: [], f: ["x", "y"], g: false })).toBe("?a=1&f=x%2Cy&g=false");
    expect(toQuery({})).toBe("");
  });
});
