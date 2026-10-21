import { api } from "./client";
import type {
  Address,
  AddressRequest,
  Cart,
  Claim,
  ClaimRequest,
  OrderDetail,
  OrderSummary,
  Page,
  ProductSummary,
} from "./types";

export const addressApi = {
  list: () => api.get<Address[]>("/me/addresses"),
  create: (body: AddressRequest) => api.post<Address>("/me/addresses", body),
  update: (id: number, body: Partial<AddressRequest>) => api.patch<Address>(`/me/addresses/${id}`, body),
  remove: (id: number) => api.delete<void>(`/me/addresses/${id}`),
};

export const wishlistApi = {
  list: () => api.get<ProductSummary[]>("/me/wishlist"),
  add: (productId: number) => api.put<void>(`/me/wishlist/${productId}`),
  remove: (productId: number) => api.delete<void>(`/me/wishlist/${productId}`),
};

export const cartApi = {
  get: () => api.get<Cart>("/me/cart"),
  add: (variantId: number, quantity: number) => api.post<Cart>("/me/cart/items", { variantId, quantity }),
  update: (id: number, quantity: number) => api.patch<Cart>(`/me/cart/items/${id}`, { quantity }),
  remove: (id: number) => api.delete<Cart | undefined>(`/me/cart/items/${id}`),
  clear: () => api.delete<void>("/me/cart"),
  merge: (items: { variantId: number; quantity: number }[]) => api.post<Cart>("/me/cart/merge", { items }),
};

export const myOrderApi = {
  list: (page = 0) => api.get<Page<OrderSummary>>("/me/orders", { page, size: 10 }),
  get: (orderNumber: string) => api.get<OrderDetail>(`/me/orders/${encodeURIComponent(orderNumber)}`),
  cancel: (orderNumber: string) => api.post<OrderDetail>(`/me/orders/${encodeURIComponent(orderNumber)}/cancel`),
  claim: (orderNumber: string, body: ClaimRequest) =>
    api.post<Claim>(`/me/orders/${encodeURIComponent(orderNumber)}/claims`, body),
};
