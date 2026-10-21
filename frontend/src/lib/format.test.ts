import { describe, expect, it } from "vitest";
import { asItems, discountRate, formatDate, formatPhone, formatPrice, maskName } from "./format";

describe("format", () => {
  it("formatPrice: 원 단위 콤마", () => {
    expect(formatPrice(289000)).toBe("289,000원");
    expect(formatPrice(0)).toBe("0원");
    expect(formatPrice(null)).toBe("0원");
  });

  it("formatDate: 점으로 구분, 잘못된 값은 -", () => {
    expect(formatDate("2026-10-21T10:00:00+09:00")).toMatch(/^2026\.10\.(20|21)$/);
    expect(formatDate(null)).toBe("-");
    expect(formatDate("nope")).toBe("-");
  });

  it("formatPhone: 휴대폰 번호 하이픈", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
    expect(formatPhone("0101234567")).toBe("010-123-4567");
    expect(formatPhone("010-12")).toBe("010-12");
  });

  it("discountRate: 정가가 더 클 때만 할인율", () => {
    expect(discountRate(70000, 100000)).toBe(30);
    expect(discountRate(100000, 100000)).toBe(0);
    expect(discountRate(100000, null)).toBe(0);
  });

  it("asItems: 배열과 Page 모두 처리", () => {
    expect(asItems([1, 2])).toEqual([1, 2]);
    expect(asItems({ items: [3], page: 0, size: 1, totalElements: 1, totalPages: 1 })).toEqual([3]);
    expect(asItems(undefined)).toEqual([]);
  });

  it("maskName", () => {
    expect(maskName("김민수")).toBe("김**");
    expect(maskName("이**")).toBe("이**");
  });
});
