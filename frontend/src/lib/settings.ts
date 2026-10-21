import type { StoreSettings } from "./api/types";

// 백엔드에 연결하지 못했을 때도 화면이 그려지도록 쓰는 기본값.
// 서버 컴포넌트에서도 읽으므로 "use client" 파일이 아닌 곳에 둔다.
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "TUK FIT",
  shippingFee: 3000,
  freeShippingThreshold: 50000,
  maxQuantityPerItem: 5,
  returnShippingFee: 6000,
  csPhone: null,
  csEmail: null,
  csHours: null,
  business: {},
  socialProviders: [],
  paymentProvider: "MOCK",
};

/** 응답에 빠진 값이 있어도 화면이 깨지지 않게 기본값과 합친다. */
export function normalizeSettings(s: Partial<StoreSettings> | null | undefined): StoreSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    business: { ...(s?.business ?? {}) },
    socialProviders: s?.socialProviders ?? [],
  };
}
