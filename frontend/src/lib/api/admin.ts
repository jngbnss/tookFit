import { api, type QueryValue } from "./client";
import type {
  AdminBanner,
  AdminCategory,
  AdminCategoryRequest,
  AdminClaim,
  AdminDashboard,
  AdminNotice,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminProductDetail,
  AdminProductRequest,
  AdminProductSummary,
  AdminReview,
  AdminSettings,
  AdminUser,
  AdminVariant,
  BannerRequest,
  Carrier,
  ClaimStatus,
  ColorInput,
  Coupon,
  CouponRequest,
  ImageInput,
  NoticeRequest,
  OrderStatus,
  Page,
  PresignRequest,
  PresignResponse,
  VariantInput,
} from "./types";

type Params = Record<string, QueryValue>;
const enc = encodeURIComponent;

export const adminApi = {
  dashboard: () => api.get<AdminDashboard>("/admin/dashboard"),

  products: (p: Params) => api.get<Page<AdminProductSummary>>("/admin/products", p),
  product: (id: number) => api.get<AdminProductDetail>(`/admin/products/${id}`),
  createProduct: (body: AdminProductRequest) => api.post<AdminProductDetail>("/admin/products", body),
  updateProduct: (id: number, body: Partial<AdminProductRequest>) =>
    api.patch<AdminProductDetail>(`/admin/products/${id}`, body),
  deleteProduct: (id: number) => api.delete<void>(`/admin/products/${id}`),
  saveColors: (id: number, colors: ColorInput[]) => api.put<AdminProductDetail>(`/admin/products/${id}/colors`, colors),
  saveVariants: (id: number, variants: VariantInput[]) =>
    api.put<AdminProductDetail>(`/admin/products/${id}/variants`, variants),
  setStock: (variantId: number, body: { stock: number } | { delta: number }) =>
    api.patch<AdminVariant>(`/admin/variants/${variantId}/stock`, body),
  saveImages: (id: number, images: ImageInput[]) => api.put<AdminProductDetail>(`/admin/products/${id}/images`, images),
  presign: (body: PresignRequest) => api.post<PresignResponse>("/admin/uploads/presign", body),

  categories: () => api.get<AdminCategory[]>("/admin/categories"),
  createCategory: (body: AdminCategoryRequest) => api.post<AdminCategory>("/admin/categories", body),
  updateCategory: (id: number, body: Partial<AdminCategoryRequest>) =>
    api.patch<AdminCategory>(`/admin/categories/${id}`, body),
  deleteCategory: (id: number) => api.delete<void>(`/admin/categories/${id}`),

  orders: (p: Params) => api.get<Page<AdminOrderSummary>>("/admin/orders", p),
  order: (n: string) => api.get<AdminOrderDetail>(`/admin/orders/${enc(n)}`),
  setOrderStatus: (n: string, status: OrderStatus, reason?: string) =>
    api.patch<AdminOrderDetail>(`/admin/orders/${enc(n)}/status`, { status, reason }),
  ship: (n: string, carrier: Carrier, trackingNumber: string) =>
    api.post<AdminOrderDetail>(`/admin/orders/${enc(n)}/shipment`, { carrier, trackingNumber }),
  cancelOrder: (n: string, reason: string) => api.post<AdminOrderDetail>(`/admin/orders/${enc(n)}/cancel`, { reason }),

  claims: (p: Params) => api.get<Page<AdminClaim>>("/admin/claims", p),
  updateClaim: (id: number, body: { status: ClaimStatus; returnShippingFee?: number; refundAmount?: number }) =>
    api.patch<AdminClaim>(`/admin/claims/${id}`, body),

  users: (p: Params) => api.get<Page<AdminUser>>("/admin/users", p),
  user: (id: number) => api.get<AdminUser>(`/admin/users/${id}`),

  reviews: (p: Params) => api.get<Page<AdminReview>>("/admin/reviews", p),
  setReviewStatus: (id: number, status: "VISIBLE" | "HIDDEN") => api.patch<AdminReview>(`/admin/reviews/${id}`, { status }),

  // 목록 형태(배열/Page)가 계약에 정해져 있지 않아 둘 다 받는다. 화면은 asItems()로 다룬다
  coupons: (p: Params = {}) => api.get<Page<Coupon> | Coupon[]>("/admin/coupons", p),
  createCoupon: (body: CouponRequest) => api.post<Coupon>("/admin/coupons", body),
  updateCoupon: (id: number, body: Partial<CouponRequest>) => api.patch<Coupon>(`/admin/coupons/${id}`, body),

  banners: (p: Params = {}) => api.get<Page<AdminBanner> | AdminBanner[]>("/admin/banners", p),
  createBanner: (body: BannerRequest) => api.post<AdminBanner>("/admin/banners", body),
  updateBanner: (id: number, body: Partial<BannerRequest>) => api.patch<AdminBanner>(`/admin/banners/${id}`, body),
  deleteBanner: (id: number) => api.delete<void>(`/admin/banners/${id}`),
  reorderBanners: (ids: number[]) => api.put<void>("/admin/banners/order", ids),

  notices: (p: Params = {}) => api.get<Page<AdminNotice>>("/admin/notices", p),
  createNotice: (body: NoticeRequest) => api.post<AdminNotice>("/admin/notices", body),
  updateNotice: (id: number, body: Partial<NoticeRequest>) => api.patch<AdminNotice>(`/admin/notices/${id}`, body),
  deleteNotice: (id: number) => api.delete<void>(`/admin/notices/${id}`),

  settings: () => api.get<AdminSettings>("/admin/settings"),
  saveSettings: (body: AdminSettings) => api.put<AdminSettings>("/admin/settings", body),
};

/** 주문 CSV는 쿠키 인증 GET이라 링크로 바로 내려받는다. */
export function orderExportUrl(params: { from?: string; to?: string; status?: string }) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
  return `/api/v1/admin/orders/export?${sp.toString()}`;
}

/** presign → 저장소에 직접 PUT 업로드. 저장할 storageKey와 미리보기 URL을 돌려준다. */
export async function uploadImage(file: File, folder: "products" | "banners") {
  const contentType = file.type || "application/octet-stream";
  const presign = await adminApi.presign({ filename: file.name, contentType, folder });
  const res = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType, ...presign.headers },
    body: file,
  });
  if (!res.ok) throw new Error(`이미지 업로드에 실패했어요 (${res.status})`);
  return { storageKey: presign.storageKey, publicUrl: presign.publicUrl };
}
