# API 계약 (DTO 형태)

[API.md](API.md)의 엔드포인트가 주고받는 JSON 형태입니다. 프론트(`frontend/src/lib/api/types.ts`)와 백엔드(Java record)는 이 문서를 그대로 따릅니다.
TypeScript 표기를 쓰고, `?`는 null일 수 있다는 뜻입니다(응답에서는 키를 생략하지 않고 `null`을 보냄).

## 공통

```ts
type Page<T> = { items: T[]; page: number; size: number; totalElements: number; totalPages: number };
type ApiError = { code: string; message: string; fields?: Record<string, string> };
type Money = number; // 원, 정수
```

## 런타임 규칙

- 같은 출처(origin). 브라우저는 상대경로 `/api/v1/...`를 부릅니다. 로컬 개발에서는 Next.js rewrites가 `/api`, `/oauth2`, `/login/oauth2`를 `http://localhost:8080`으로 넘기고, 운영에서는 Nginx가 넘깁니다.
- Next.js 서버 쪽 요청은 `INTERNAL_API_URL`(기본 `http://localhost:8080`, Docker 안에서는 `http://backend:8080`)로 보내고, 들어온 요청의 `cookie` 헤더를 전달합니다.
- **CSRF**: 백엔드가 `XSRF-TOKEN` 쿠키(HttpOnly 아님)를 발급합니다. 프론트는 POST/PUT/PATCH/DELETE 요청에 그 값을 `X-XSRF-TOKEN` 헤더로 보냅니다. 쿠키가 없으면 먼저 `GET /api/v1/auth/csrf`(204)를 호출해서 받습니다. 예외: `/payments/webhook/**`
- **토큰 만료**: 401 `TOKEN_EXPIRED`이면 `POST /auth/refresh` 후 한 번만 재시도합니다. refresh도 실패하면 로그아웃 상태로 처리합니다.
- **이미지 URL**: 응답의 `url`은 항상 완전한 URL입니다. 백엔드가 `app.storage.public-base-url + "/" + storageKey`로 조합합니다.
- 소셜 로그인: 프론트는 `/oauth2/authorization/kakao?redirect=/mypage` 형태로 이동합니다. 성공하면 백엔드가 `${APP_FRONTEND_URL}${redirect}`로, 실패하면 `${APP_FRONTEND_URL}/login?error=oauth`로 리다이렉트합니다. 키가 설정되지 않은 provider는 `GET /store/settings`의 `socialProviders`에서 빠집니다.

## 인증, 회원

```ts
// POST /auth/signup
type SignupRequest = { email: string; password: string; name: string; phone?: string;
  agreeTerms: boolean; agreePrivacy: boolean; agreeMarketing: boolean };
// POST /auth/login
type LoginRequest = { email: string; password: string };
// signup, login 응답 = Me (쿠키도 함께 발급)

type Me = { id: number; email?: string; name: string; phone?: string;
  role: 'USER' | 'ADMIN'; marketingAgreed: boolean; hasPassword: boolean;
  socialProviders: ('KAKAO' | 'NAVER')[]; createdAt: string };

type UpdateMeRequest = { name?: string; phone?: string; marketingAgreed?: boolean };
type ChangePasswordRequest = { currentPassword?: string; newPassword: string }; // 소셜 전용 회원은 current 없이 설정
type PasswordResetRequest = { email: string };              // 항상 204 (가입 여부 노출 안 함)
type PasswordResetConfirm = { token: string; newPassword: string };

type Address = { id: number; label?: string; recipient: string; phone: string;
  postalCode: string; address1: string; address2?: string; isDefault: boolean };
type AddressRequest = Omit<Address, 'id'>;
```

비밀번호 규칙: 8~64자, 영문과 숫자 포함.

## 카탈로그

```ts
type Category = { id: number; slug: string; name: string; sortOrder: number };

type Color = { id: number; name: string; hex: string };
type Image = { id: number; url: string; alt?: string; colorId?: number; sortOrder: number };
type Variant = { id: number; colorId: number; size: string; sku: string; stock: number; available: boolean };
type Badge = 'NEW' | 'BEST' | 'LIMITED' | 'SALE';

type ProductSummary = { id: number; slug: string; name: string;
  category: { slug: string; name: string };
  price: Money; originalPrice?: Money; discountRate: number; // 0~100 정수
  badge?: Badge; thumbnailUrl?: string; hoverImageUrl?: string;
  colors: Color[]; inStock: boolean; rating: { average: number; count: number } };

type ProductDetail = ProductSummary & {
  description?: string; material?: string; fit?: string; care: string[];
  sizes: string[];               // 표시 순서
  images: Image[]; variants: Variant[] };

// GET /products  → Page<ProductSummary>
// GET /products/suggestions?q= → { slug: string; name: string; thumbnailUrl?: string }[]
// GET /products/{slug}/related → ProductSummary[]
```

`GET /products` 쿼리: `q`, `collection`(`all`|`new-arrivals`|`best-sellers`|`sale`), `category`(slug), `sizes`(쉼표 구분), `colors`(색상 이름, 쉼표 구분), `minPrice`, `maxPrice`, `inStock`(true), `sort`(`featured`|`newest`|`price-asc`|`price-desc`), `page`, `size`(기본 24, 최대 60)

- `new-arrivals`: `published_at` 최근 30일 또는 badge NEW
- `best-sellers`: badge BEST 또는 `featured_rank` 상위
- `sale`: `original_price > price`

## 리뷰

```ts
type FitFeedback = 'SMALL' | 'TRUE' | 'LARGE';
type Review = { id: number; authorName: string; // 마스킹: "김**"
  rating: number; title?: string; body: string; heightCm?: number; fitFeedback?: FitFeedback;
  option: string;            // "블랙 / M"
  createdAt: string; mine: boolean };
type ReviewSummary = { average: number; count: number; distribution: Record<'1'|'2'|'3'|'4'|'5', number> };
// GET /products/{slug}/reviews → { summary: ReviewSummary; page: Page<Review> }
type ReviewRequest = { orderItemId: number; rating: number; title?: string; body: string;
  heightCm?: number; fitFeedback?: FitFeedback };
type ReviewableItem = { orderItemId: number; orderNumber: string; productSlug: string;
  productName: string; option: string; imageUrl?: string; deliveredAt: string };
```

## 장바구니, 위시리스트

```ts
type CartItem = { id: number; variantId: number; productId: number; productSlug: string;
  productName: string; colorName: string; size: string; imageUrl?: string;
  unitPrice: Money; originalPrice?: Money; quantity: number; lineTotal: Money;
  stock: number; available: boolean };           // 품절이나 판매 중지면 false
type Totals = { subtotal: Money; discount: Money; shippingFee: Money; total: Money;
  itemCount: number; freeShippingRemaining: Money };
type Cart = { items: CartItem[]; totals: Totals };  // 쿠폰 없이 계산
// POST /me/cart/items { variantId, quantity } → Cart
// PATCH /me/cart/items/{id} { quantity } → Cart
// POST /me/cart/merge { items: { variantId, quantity }[] } → Cart

// GET /me/wishlist → ProductSummary[]
// PUT/DELETE /me/wishlist/{productId} → 204
```

## 주문, 결제

```ts
type OrderItemInput = { variantId: number; quantity: number };

// POST /orders/preview
type OrderPreviewRequest = { items: OrderItemInput[]; couponCode?: string };
type OrderPreview = { items: CartItem[]; totals: Totals;
  coupon?: { code: string; name: string; discount: Money };
  couponError?: string };   // 쿠폰이 안 맞으면 메시지, 할인 0으로 계산

// POST /orders
type CreateOrderRequest = { items: OrderItemInput[]; couponCode?: string;
  shipping: { recipient: string; phone: string; postalCode: string; address1: string; address2?: string };
  saveAddress: boolean; deliveryMemo?: string; fromCart: boolean };
type CreateOrderResponse = { orderNumber: string; orderName: string; amount: Money;
  customer: { name: string; email?: string; phone?: string };
  payment: { provider: 'MOCK' | 'TOSS'; clientKey?: string; customerKey: string } };

type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';
type OrderItem = { id: number; variantId: number; productId: number; productSlug: string;
  productName: string; colorName: string; size: string; imageUrl?: string;
  unitPrice: Money; quantity: number; lineTotal: Money; reviewable: boolean; reviewed: boolean };
type OrderSummary = { orderNumber: string; status: OrderStatus; orderName: string;
  total: Money; itemCount: number; thumbnailUrl?: string; createdAt: string };
type OrderDetail = OrderSummary & {
  items: OrderItem[]; totals: Totals; couponCode?: string;
  shipping: { recipient: string; phone: string; postalCode: string; address1: string; address2?: string; deliveryMemo?: string };
  payment?: { provider: string; method?: string; status: string; amount: Money; cancelledAmount: Money; approvedAt?: string };
  shipment?: { carrier: string; carrierName: string; trackingNumber: string; trackingUrl?: string; shippedAt?: string; deliveredAt?: string };
  claims: Claim[];
  history: { fromStatus?: OrderStatus; toStatus: OrderStatus; reason?: string; createdAt: string }[];
  cancellable: boolean; paidAt?: string; cancelledAt?: string };
// GET /me/orders → Page<OrderSummary>

// POST /payments/confirm
type PaymentConfirmRequest = { orderNumber: string; paymentKey: string; amount: Money };  // → OrderDetail
type PaymentFailRequest = { orderNumber: string; code?: string; message?: string };     // → 204

type ClaimType = 'RETURN' | 'EXCHANGE';
type ClaimReason = 'CHANGE_OF_MIND' | 'SIZE' | 'DEFECT' | 'WRONG_ITEM';
type ClaimStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
type ClaimRequest = { orderItemId: number; type: ClaimType; reasonType: ClaimReason;
  reasonDetail?: string; quantity: number; exchangeVariantId?: number };
type Claim = { id: number; orderItemId: number; type: ClaimType; reasonType: ClaimReason;
  reasonDetail?: string; quantity: number; status: ClaimStatus;
  returnShippingFee: Money; refundAmount?: Money; createdAt: string };
```

**결제 provider**
- `MOCK`: 키가 없을 때 기본값. 프론트는 결제창 없이 `/checkout/success?paymentKey=mock_<랜덤>&orderId=<orderNumber>&amount=<amount>`로 이동합니다. 백엔드는 MOCK 승인을 항상 성공시킵니다(금액 검증은 동일하게 수행). 운영 프로필에서 MOCK을 쓰면 시작 로그에 경고를 남깁니다.
- `TOSS`: 프론트는 토스페이먼츠 JS SDK v2(`https://js.tosspayments.com/v2/standard`)로 `requestPayment`를 호출합니다. `orderId = orderNumber`, `successUrl = {origin}/checkout/success`, `failUrl = {origin}/checkout/fail`. 성공 페이지는 쿼리의 `paymentKey`, `orderId`, `amount`로 `/payments/confirm`을 호출합니다.

## 화면 운영

```ts
type BannerPosition = 'MAIN_HERO' | 'MAIN_MIDDLE' | 'TOP_STRIP';
type Banner = { id: number; position: BannerPosition; title?: string; subtitle?: string;
  imageUrl?: string; mobileImageUrl?: string; linkUrl?: string; sortOrder: number };
type Notice = { id: number; title: string; body: string; pinned: boolean; createdAt: string };
// GET /notices → Page<Omit<Notice, 'body'>>
type StoreSettings = { storeName: string; shippingFee: Money; freeShippingThreshold: Money;
  maxQuantityPerItem: number; returnShippingFee: Money;
  csPhone?: string; csEmail?: string; csHours?: string;
  business: { companyName?: string; ceoName?: string; registrationNumber?: string;
    mailOrderNumber?: string; address?: string; privacyOfficer?: string };
  socialProviders: ('KAKAO' | 'NAVER')[];
  paymentProvider: 'MOCK' | 'TOSS' };
```

사업자 정보는 설정값이 비어 있으면 화면 하단에 "사업자 정보 준비 중"으로 표시합니다. 사업자등록 후 관리자 설정에서 입력하면 바로 반영됩니다.

## 관리자

```ts
type AdminDashboard = {
  today: { sales: Money; orders: number }; week: { sales: Money; orders: number };
  statusCounts: Record<OrderStatus, number>; pendingClaims: number;
  lowStock: { variantId: number; productId: number; productName: string; option: string; stock: number }[];
  recentOrders: AdminOrderSummary[] };

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN';
type AdminProductSummary = { id: number; slug: string; name: string; categoryName: string;
  price: Money; originalPrice?: Money; status: ProductStatus; badge?: Badge;
  thumbnailUrl?: string; totalStock: number; variantCount: number; updatedAt: string };
type AdminProductDetail = { id: number; slug: string; name: string; categoryId: number;
  description?: string; price: Money; originalPrice?: Money; badge?: Badge;
  material?: string; fit?: string; care: string[]; status: ProductStatus; featuredRank?: number;
  publishedAt?: string; colors: (Color & { sortOrder: number })[];
  variants: (Variant & { active: boolean })[];
  images: (Image & { storageKey: string })[] };
type AdminProductRequest = Omit<AdminProductDetail, 'id' | 'colors' | 'variants' | 'images' | 'publishedAt'>;
// PUT /admin/products/{id}/colors  [{ id?, name, hex, sortOrder }] → AdminProductDetail
//   (id가 없으면 추가, 목록에 없는 기존 색상은 삭제. 주문된 옵션이 있는 색상은 삭제 불가 409)
// PUT /admin/products/{id}/variants [{ id?, colorId, size, sku?, stock, active }] → AdminProductDetail
//   (sku가 비면 자동 생성. 목록에 없는 기존 옵션은 active=false 처리)
// PATCH /admin/variants/{id}/stock { stock } | { delta } → Variant
// PUT /admin/products/{id}/images [{ id?, storageKey, alt?, colorId?, sortOrder }] → AdminProductDetail
// POST /admin/uploads/presign { filename, contentType, folder: 'products'|'banners' }
//   → { uploadUrl: string; storageKey: string; publicUrl: string; headers: Record<string,string> }
//   브라우저가 uploadUrl로 PUT 업로드 후 storageKey를 저장

type AdminOrderSummary = OrderSummary & { ordererName: string; ordererPhone?: string; recipient: string };
type AdminOrderDetail = OrderDetail & { user: { id: number; name: string; email?: string; phone?: string };
  orderer: { name: string; email?: string; phone?: string };
  payments: { id: number; provider: string; pgPaymentKey?: string; method?: string; status: string;
    amount: Money; cancelledAmount: Money; approvedAt?: string; failureReason?: string }[];
  nextStatuses: OrderStatus[] };
// PATCH /admin/orders/{n}/status { status, reason? } → AdminOrderDetail
// POST /admin/orders/{n}/shipment { carrier: 'CJ'|'HANJIN'|'LOTTE'|'POST'|'LOGEN', trackingNumber } → AdminOrderDetail
// POST /admin/orders/{n}/cancel { reason } → AdminOrderDetail
// GET /admin/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status= → text/csv (UTF-8 BOM)

type AdminClaim = Claim & { orderNumber: string; productName: string; option: string; customerName: string };
// PATCH /admin/claims/{id} { status, returnShippingFee?, refundAmount? } → AdminClaim

type AdminUser = { id: number; email?: string; name: string; phone?: string; role: 'USER'|'ADMIN';
  status: 'ACTIVE'|'WITHDRAWN'; socialProviders: string[]; orderCount: number; totalSpent: Money;
  createdAt: string; lastLoginAt?: string };
type AdminReview = Review & { productName: string; productSlug: string; userId: number; status: 'VISIBLE'|'HIDDEN' };

type Coupon = { id: number; code: string; name: string; discountType: 'PERCENT'|'FIXED';
  discountValue: number; maxDiscount?: Money; minOrderAmount: Money;
  startsAt?: string; endsAt?: string; usageLimit?: number; perUserLimit: number;
  usedCount: number; active: boolean };
type CouponRequest = Omit<Coupon, 'id' | 'usedCount'>;

type AdminBanner = Banner & { imageKey?: string; mobileImageKey?: string;
  startsAt?: string; endsAt?: string; active: boolean };
type BannerRequest = Omit<AdminBanner, 'id' | 'imageUrl' | 'mobileImageUrl'>;
type AdminNotice = Notice & { published: boolean; updatedAt: string };
type NoticeRequest = { title: string; body: string; pinned: boolean; published: boolean };

type AdminCategoryRequest = { slug: string; name: string; sortOrder: number; visible: boolean };
// GET /admin/categories → (Category & { visible: boolean; productCount: number })[]

// GET/PUT /admin/settings → StoreSettings에서 socialProviders, paymentProvider를 뺀 값
```

## 개발용 기본 데이터 (`dev` 프로필 전용)

- 관리자: `admin@tukfit.local` / `admin1234!`
- 테스트 회원: `user@tukfit.local` / `user1234!`
- 프로토타입 상품 46개, 카테고리 8개, 쿠폰 `TUK10`(10%, 최대 20,000원), 배너, 공지
- 이미지: 로컬 MinIO 버킷 `tukfit`의 `products/<파일명>.webp`

운영 환경의 첫 관리자는 환경변수 `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 서버가 처음 뜰 때 만들어집니다.
