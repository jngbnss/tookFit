// docs/API-CONTRACT.md 의 DTO를 그대로 옮긴 타입. 계약이 바뀌면 이 파일부터 고친다.

export type Money = number;

export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ApiErrorBody = { code: string; message: string; fields?: Record<string, string> };

// ── 인증, 회원 ─────────────────────────────────────────

export type SocialProvider = "KAKAO" | "NAVER";
export type Role = "USER" | "ADMIN";

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
};
export type LoginRequest = { email: string; password: string };

export type Me = {
  id: number;
  email?: string | null;
  name: string;
  phone?: string | null;
  role: Role;
  marketingAgreed: boolean;
  hasPassword: boolean;
  socialProviders: SocialProvider[];
  createdAt: string;
};

export type UpdateMeRequest = { name?: string; phone?: string; marketingAgreed?: boolean };
export type ChangePasswordRequest = { currentPassword?: string; newPassword: string };
export type PasswordResetRequest = { email: string };
export type PasswordResetConfirm = { token: string; newPassword: string };

export type Address = {
  id: number;
  label?: string | null;
  recipient: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2?: string | null;
  isDefault: boolean;
};
export type AddressRequest = Omit<Address, "id">;

// ── 카탈로그 ───────────────────────────────────────────

export type Category = { id: number; slug: string; name: string; sortOrder: number };
export type Color = { id: number; name: string; hex: string };
export type Image = { id: number; url: string; alt?: string | null; colorId?: number | null; sortOrder: number };
export type Variant = { id: number; colorId: number; size: string; sku: string; stock: number; available: boolean };
export type Badge = "NEW" | "BEST" | "LIMITED" | "SALE";

export type ProductSummary = {
  id: number;
  slug: string;
  name: string;
  category: { slug: string; name: string };
  price: Money;
  originalPrice?: Money | null;
  discountRate: number;
  badge?: Badge | null;
  thumbnailUrl?: string | null;
  hoverImageUrl?: string | null;
  colors: Color[];
  inStock: boolean;
  rating: { average: number; count: number };
};

export type ProductDetail = ProductSummary & {
  description?: string | null;
  material?: string | null;
  fit?: string | null;
  care: string[];
  sizes: string[];
  images: Image[];
  variants: Variant[];
};

export type Suggestion = { slug: string; name: string; thumbnailUrl?: string | null };

export type Collection = "all" | "new-arrivals" | "best-sellers" | "sale";
export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export type ProductQuery = {
  q?: string;
  collection?: Collection;
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
  size?: number;
};

// ── 리뷰 ─────────────────────────────────────────────

export type FitFeedback = "SMALL" | "TRUE" | "LARGE";
export type Review = {
  id: number;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  heightCm?: number | null;
  fitFeedback?: FitFeedback | null;
  option: string;
  createdAt: string;
  mine: boolean;
};
export type ReviewSummary = {
  average: number;
  count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
};
export type ProductReviews = { summary: ReviewSummary; page: Page<Review> };
export type ReviewRequest = {
  orderItemId: number;
  rating: number;
  title?: string;
  body: string;
  heightCm?: number;
  fitFeedback?: FitFeedback;
};
export type ReviewableItem = {
  orderItemId: number;
  orderNumber: string;
  productSlug: string;
  productName: string;
  option: string;
  imageUrl?: string | null;
  deliveredAt: string;
};

// ── 장바구니 ─────────────────────────────────────────

export type CartItem = {
  id: number;
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  colorName: string;
  size: string;
  imageUrl?: string | null;
  unitPrice: Money;
  originalPrice?: Money | null;
  quantity: number;
  lineTotal: Money;
  stock: number;
  available: boolean;
};
export type Totals = {
  subtotal: Money;
  discount: Money;
  shippingFee: Money;
  total: Money;
  itemCount: number;
  freeShippingRemaining: Money;
};
export type Cart = { items: CartItem[]; totals: Totals };

// ── 주문, 결제 ────────────────────────────────────────

export type OrderItemInput = { variantId: number; quantity: number };
export type OrderPreviewRequest = { items: OrderItemInput[]; couponCode?: string };
export type OrderPreview = {
  items: CartItem[];
  totals: Totals;
  coupon?: { code: string; name: string; discount: Money } | null;
  couponError?: string | null;
};

export type ShippingInput = {
  recipient: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2?: string;
};
export type CreateOrderRequest = {
  items: OrderItemInput[];
  couponCode?: string;
  shipping: ShippingInput;
  saveAddress: boolean;
  deliveryMemo?: string;
  fromCart: boolean;
};
export type PaymentProvider = "MOCK" | "TOSS";
export type CreateOrderResponse = {
  orderNumber: string;
  orderName: string;
  amount: Money;
  customer: { name: string; email?: string | null; phone?: string | null };
  payment: { provider: PaymentProvider; clientKey?: string | null; customerKey: string };
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderItem = {
  id: number;
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  colorName: string;
  size: string;
  imageUrl?: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  reviewable: boolean;
  reviewed: boolean;
};

export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  orderName: string;
  total: Money;
  itemCount: number;
  thumbnailUrl?: string | null;
  createdAt: string;
};

export type ClaimType = "RETURN" | "EXCHANGE";
export type ClaimReason = "CHANGE_OF_MIND" | "SIZE" | "DEFECT" | "WRONG_ITEM";
export type ClaimStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
export type ClaimRequest = {
  orderItemId: number;
  type: ClaimType;
  reasonType: ClaimReason;
  reasonDetail?: string;
  quantity: number;
  exchangeVariantId?: number;
};
export type Claim = {
  id: number;
  orderItemId: number;
  type: ClaimType;
  reasonType: ClaimReason;
  reasonDetail?: string | null;
  quantity: number;
  status: ClaimStatus;
  returnShippingFee: Money;
  refundAmount?: Money | null;
  createdAt: string;
};

export type OrderShipping = ShippingInput & { deliveryMemo?: string | null };
export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  totals: Totals;
  couponCode?: string | null;
  shipping: OrderShipping;
  payment?: {
    provider: string;
    method?: string | null;
    status: string;
    amount: Money;
    cancelledAmount: Money;
    approvedAt?: string | null;
  } | null;
  shipment?: {
    carrier: string;
    carrierName: string;
    trackingNumber: string;
    trackingUrl?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
  } | null;
  claims: Claim[];
  history: { fromStatus?: OrderStatus | null; toStatus: OrderStatus; reason?: string | null; createdAt: string }[];
  cancellable: boolean;
  paidAt?: string | null;
  cancelledAt?: string | null;
};

export type PaymentConfirmRequest = { orderNumber: string; paymentKey: string; amount: Money };
export type PaymentFailRequest = { orderNumber: string; code?: string; message?: string };

// ── 화면 운영 ─────────────────────────────────────────

export type BannerPosition = "MAIN_HERO" | "MAIN_MIDDLE" | "TOP_STRIP";
export type Banner = {
  id: number;
  position: BannerPosition;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  sortOrder: number;
};
export type Notice = { id: number; title: string; body: string; pinned: boolean; createdAt: string };
export type NoticeSummary = Omit<Notice, "body">;

export type BusinessInfo = {
  companyName?: string | null;
  ceoName?: string | null;
  registrationNumber?: string | null;
  mailOrderNumber?: string | null;
  address?: string | null;
  privacyOfficer?: string | null;
};
export type StoreSettings = {
  storeName: string;
  shippingFee: Money;
  freeShippingThreshold: Money;
  maxQuantityPerItem: number;
  returnShippingFee: Money;
  csPhone?: string | null;
  csEmail?: string | null;
  csHours?: string | null;
  business: BusinessInfo;
  socialProviders: SocialProvider[];
  paymentProvider: PaymentProvider;
};
export type AdminSettings = Omit<StoreSettings, "socialProviders" | "paymentProvider">;

// ── 관리자 ───────────────────────────────────────────

export type ProductStatus = "DRAFT" | "ACTIVE" | "HIDDEN";
export type Carrier = "CJ" | "HANJIN" | "LOTTE" | "POST" | "LOGEN";

export type AdminOrderSummary = OrderSummary & {
  ordererName: string;
  ordererPhone?: string | null;
  recipient: string;
};

export type AdminDashboard = {
  today: { sales: Money; orders: number };
  week: { sales: Money; orders: number };
  statusCounts: Record<OrderStatus, number>;
  pendingClaims: number;
  lowStock: { variantId: number; productId: number; productName: string; option: string; stock: number }[];
  recentOrders: AdminOrderSummary[];
};

export type AdminProductSummary = {
  id: number;
  slug: string;
  name: string;
  categoryName: string;
  price: Money;
  originalPrice?: Money | null;
  status: ProductStatus;
  badge?: Badge | null;
  thumbnailUrl?: string | null;
  totalStock: number;
  variantCount: number;
  updatedAt: string;
};

export type AdminColor = Color & { sortOrder: number };
export type AdminVariant = Variant & { active: boolean };
export type AdminImage = Image & { storageKey: string };

export type AdminProductDetail = {
  id: number;
  slug: string;
  name: string;
  categoryId: number;
  description?: string | null;
  price: Money;
  originalPrice?: Money | null;
  badge?: Badge | null;
  material?: string | null;
  fit?: string | null;
  care: string[];
  status: ProductStatus;
  featuredRank?: number | null;
  publishedAt?: string | null;
  colors: AdminColor[];
  variants: AdminVariant[];
  images: AdminImage[];
};
export type AdminProductRequest = Omit<AdminProductDetail, "id" | "colors" | "variants" | "images" | "publishedAt">;

export type ColorInput = { id?: number; name: string; hex: string; sortOrder: number };
export type VariantInput = { id?: number; colorId: number; size: string; sku?: string; stock: number; active: boolean };
export type ImageInput = { id?: number; storageKey: string; alt?: string; colorId?: number | null; sortOrder: number };

export type PresignRequest = { filename: string; contentType: string; folder: "products" | "banners" };
export type PresignResponse = {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  headers: Record<string, string>;
};

export type AdminOrderPayment = {
  id: number;
  provider: string;
  pgPaymentKey?: string | null;
  method?: string | null;
  status: string;
  amount: Money;
  cancelledAmount: Money;
  approvedAt?: string | null;
  failureReason?: string | null;
};
export type AdminOrderDetail = OrderDetail & {
  user: { id: number; name: string; email?: string | null; phone?: string | null };
  orderer: { name: string; email?: string | null; phone?: string | null };
  payments: AdminOrderPayment[];
  nextStatuses: OrderStatus[];
};

export type AdminClaim = Claim & {
  orderNumber: string;
  productName: string;
  option: string;
  customerName: string;
};

export type AdminUser = {
  id: number;
  email?: string | null;
  name: string;
  phone?: string | null;
  role: Role;
  status: "ACTIVE" | "WITHDRAWN";
  socialProviders: string[];
  orderCount: number;
  totalSpent: Money;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type AdminReview = Review & {
  productName: string;
  productSlug: string;
  userId: number;
  status: "VISIBLE" | "HIDDEN";
};

export type Coupon = {
  id: number;
  code: string;
  name: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscount?: Money | null;
  minOrderAmount: Money;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perUserLimit: number;
  usedCount: number;
  active: boolean;
};
export type CouponRequest = Omit<Coupon, "id" | "usedCount">;

export type AdminBanner = Banner & {
  imageKey?: string | null;
  mobileImageKey?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
};
export type BannerRequest = Omit<AdminBanner, "id" | "imageUrl" | "mobileImageUrl">;

export type AdminNotice = Notice & { published: boolean; updatedAt: string };
export type NoticeRequest = { title: string; body: string; pinned: boolean; published: boolean };

export type AdminCategory = Category & { visible: boolean; productCount: number };
export type AdminCategoryRequest = { slug: string; name: string; sortOrder: number; visible: boolean };
