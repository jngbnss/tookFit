import { api } from "./client";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  OrderPreview,
  OrderPreviewRequest,
  PaymentConfirmRequest,
  PaymentFailRequest,
} from "./types";

export const orderApi = {
  preview: (body: OrderPreviewRequest) => api.post<OrderPreview>("/orders/preview", body),
  create: (body: CreateOrderRequest) => api.post<CreateOrderResponse>("/orders", body),
};

export const paymentApi = {
  confirm: (body: PaymentConfirmRequest) => api.post<OrderDetail>("/payments/confirm", body),
  fail: (body: PaymentFailRequest) => api.post<void>("/payments/fail", body),
};
