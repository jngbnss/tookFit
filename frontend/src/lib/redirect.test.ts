import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("사이트 안 경로만 허용한다", () => {
    expect(safeRedirect("/checkout?mode=buy-now")).toBe("/checkout?mode=buy-now");
    expect(safeRedirect("https://evil.example")).toBe("/");
    expect(safeRedirect("//evil.example")).toBe("/");
    expect(safeRedirect("/\\evil.example")).toBe("/");
    expect(safeRedirect("/login?redirect=/x")).toBe("/");
    expect(safeRedirect(null, "/mypage")).toBe("/mypage");
  });
});
