# API 설계

Spring Boot REST API입니다. 테이블 구조는 [DATABASE.md](DATABASE.md)를 참고하세요.

## 공통

- **기본 경로**: `/api/v1`. Nginx가 `/api`를 Spring으로, 나머지는 Next.js로 보냅니다. 같은 도메인이라 CORS가 필요 없습니다.
- **형식**: JSON, `camelCase`. 금액은 정수(원), 시간은 ISO-8601(`2026-10-21T10:00:00+09:00`)
- **문서**: springdoc-openapi로 `/api/v1/docs` (Swagger UI)를 자동 생성합니다. 운영 환경에서는 관리자만 볼 수 있습니다.

### 인증

- 로그인하면 Spring이 쿠키 두 개를 발급합니다. 모두 `HttpOnly; Secure; SameSite=Lax`입니다.
  - `access_token`: JWT, 15분
  - `refresh_token`: 불투명 토큰, 14일, DB에 해시로 저장. 재발급할 때마다 교체(rotation)
- Next.js 서버 컴포넌트가 API를 부를 때는 받은 쿠키를 그대로 전달합니다. (내부 주소 `http://backend:8080`)
- CSRF: `SameSite=Lax`와 함께, 상태를 바꾸는 요청(POST/PATCH/PUT/DELETE)에 Spring Security의 CSRF 토큰(`XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더)을 사용합니다.
- 권한: 🔓 누구나 · 🔑 로그인 회원 · 🛡️ `ADMIN`

### 페이지네이션

요청: `?page=0&size=20&sort=createdAt,desc`

```json
{ "items": [], "page": 0, "size": 20, "totalElements": 48, "totalPages": 3 }
```

### 에러

```json
{ "code": "OUT_OF_STOCK", "message": "선택한 옵션의 재고가 부족해요.", "fields": { "quantity": "최대 2개까지 주문할 수 있어요." } }
```

| HTTP | 언제 | code 예시 |
|---|---|---|
| 400 | 입력값 오류 | `VALIDATION_FAILED` |
| 401 | 로그인 필요, 토큰 만료 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 403 | 권한 없음 | `FORBIDDEN` |
| 404 | 없음 | `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND` |
| 409 | 상태 충돌 | `OUT_OF_STOCK`, `EMAIL_DUPLICATED`, `ORDER_NOT_CANCELLABLE`, `COUPON_INVALID` |
| 422 | 결제 검증 실패 | `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_FAILED` |

## 고객 API

### 인증 `/auth`

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | 🔓 | 이메일 가입 `{email, password, name, phone, agreements}` |
| POST | `/auth/login` | 🔓 | 이메일 로그인 → 쿠키 발급 |
| POST | `/auth/refresh` | 🔓 | refresh 쿠키로 access 재발급 |
| POST | `/auth/logout` | 🔑 | 토큰 폐기, 쿠키 삭제 |
| GET | `/oauth2/authorization/{kakao\|naver}` | 🔓 | 소셜 로그인 시작 (Spring Security 기본 경로) |
| GET | `/login/oauth2/code/{provider}` | 🔓 | 소셜 콜백 → 쿠키 발급 후 프론트로 리다이렉트 |
| POST | `/auth/password/reset-request` | 🔓 | 재설정 메일 발송 `{email}` |
| POST | `/auth/password/reset` | 🔓 | `{token, newPassword}` |

### 내 정보 `/me`

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/me` | 🔑 | 내 정보 (이름, 이메일, 역할, 연결된 소셜) |
| PATCH | `/me` | 🔑 | 이름, 연락처, 마케팅 동의 수정 |
| PATCH | `/me/password` | 🔑 | `{currentPassword, newPassword}` |
| DELETE | `/me` | 🔑 | 회원 탈퇴 (진행 중인 주문이 있으면 409) |
| GET/POST | `/me/addresses` | 🔑 | 배송지 목록, 추가 |
| PATCH/DELETE | `/me/addresses/{id}` | 🔑 | 배송지 수정, 삭제 |

### 상품 (카탈로그)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/categories` | 🔓 | 노출 중인 카테고리 |
| GET | `/products` | 🔓 | 목록 (아래 쿼리) |
| GET | `/products/suggestions?q=` | 🔓 | 검색어 자동완성 (최대 8개) |
| GET | `/products/{slug}` | 🔓 | 상세: 색상, 이미지, 옵션별 재고, 평점 요약 |
| GET | `/products/{slug}/related` | 🔓 | 같은 카테고리 추천 (최대 8개) |

`GET /products` 쿼리: `q`, `collection`(`new-arrivals`, `best-sellers`, `sale`, `all`), `category`, `sizes`, `colors`, `minPrice`, `maxPrice`, `inStock`, `sort`(`featured`, `newest`, `price-asc`, `price-desc`), `page`, `size`

```json
// GET /products/ardent-wool-overcoat
{
  "id": 12, "slug": "ardent-wool-overcoat", "name": "아던트 울 오버코트",
  "category": { "slug": "outerwear", "name": "아우터" },
  "price": 289000, "originalPrice": 329000, "badge": "SALE",
  "description": "…", "material": "울 80%, 나일론 20%", "fit": "오버핏", "care": ["드라이클리닝"],
  "colors": [{ "id": 31, "name": "블랙", "hex": "#111111" }],
  "images": [{ "url": "https://img.tukfit.com/products/12/a.webp", "alt": "…", "colorId": 31 }],
  "variants": [{ "id": 501, "colorId": 31, "size": "M", "stock": 3, "available": true }],
  "rating": { "average": 4.6, "count": 18 }
}
```

### 리뷰

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/products/{slug}/reviews` | 🔓 | 목록 + 평점 분포. `sort=newest\|rating` |
| GET | `/me/reviewable-items` | 🔑 | 리뷰를 쓸 수 있는 주문 상품 (배송 완료, 미작성) |
| POST | `/reviews` | 🔑 | `{orderItemId, rating, title, body, heightCm, fitFeedback}` |
| PATCH/DELETE | `/reviews/{id}` | 🔑 | 본인 리뷰만 |
| GET | `/me/reviews` | 🔑 | 내가 쓴 리뷰 |

### 위시리스트, 장바구니

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/me/wishlist` | 🔑 | |
| PUT | `/me/wishlist/{productId}` | 🔑 | 추가 (이미 있으면 그대로) |
| DELETE | `/me/wishlist/{productId}` | 🔑 | |
| GET | `/me/cart` | 🔑 | 항목 + 서버 계산 금액 (품절 항목 표시) |
| POST | `/me/cart/items` | 🔑 | `{variantId, quantity}`. 같은 옵션이면 수량 합산 (최대 5) |
| PATCH | `/me/cart/items/{id}` | 🔑 | `{quantity}` |
| DELETE | `/me/cart/items/{id}` | 🔑 | |
| DELETE | `/me/cart` | 🔑 | 비우기 |
| POST | `/me/cart/merge` | 🔑 | 로그인 직후 비회원 장바구니 합치기 `{items: [{variantId, quantity}]}` |

### 주문

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/orders/preview` | 🔑 | 주문서 금액 계산 `{items, couponCode}` → 소계, 할인, 배송비, 합계, 쿠폰 오류 |
| POST | `/orders` | 🔑 | 주문 생성 (`PENDING_PAYMENT`). 결제창 호출에 필요한 값 반환 |
| GET | `/me/orders` | 🔑 | 내 주문 목록 |
| GET | `/me/orders/{orderNumber}` | 🔑 | 상세: 상품, 금액, 배송지, 결제, 송장, 상태 이력 |
| POST | `/me/orders/{orderNumber}/cancel` | 🔑 | `PAID`까지만 가능 → 전액 환불, 재고 복구 |
| POST | `/me/orders/{orderNumber}/claims` | 🔑 | 반품, 교환 요청 `{orderItemId, type, reasonType, reasonDetail, quantity}` (배송 완료 후 7일 이내) |

```json
// POST /orders 요청
{
  "items": [{ "variantId": 501, "quantity": 1 }],
  "couponCode": "TUK10",
  "addressId": 7,
  "deliveryMemo": "문 앞에 놓아주세요",
  "fromCart": true
}
// 응답
{ "orderNumber": "20261021-A1B2C3", "orderName": "아던트 울 오버코트 외 1건", "amount": 263100,
  "customer": { "name": "홍길동", "email": "…" } }
```

### 결제

PG사는 미정이라 아래 흐름을 공통으로 쓰고, Spring의 `PaymentGateway` 인터페이스 구현체만 바꿉니다.

```
1. POST /orders              → 주문 생성 (PENDING_PAYMENT)
2. 프론트에서 PG 결제창 호출   → 고객이 결제
3. PG가 successUrl로 리다이렉트 (paymentKey, orderNumber, amount)
4. POST /payments/confirm    → 서버가 금액 검증 → PG 승인 API 호출
                               → 재고 차감 → PAID, 장바구니에서 제거
5. 실패하면 PG 결제 취소, 주문은 PENDING_PAYMENT 유지 (재시도 가능)
```

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/payments/confirm` | 🔑 | `{orderNumber, paymentKey, amount}` → 주문 상세 |
| POST | `/payments/fail` | 🔑 | 사용자가 취소하거나 실패했을 때 기록 `{orderNumber, code, message}` |
| POST | `/payments/webhook/{provider}` | 🔓 | PG 웹훅. 서명 검증 필수. 같은 이벤트는 한 번만 처리 (멱등) |

### 화면 운영 데이터

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/banners?position=MAIN_HERO` | 🔓 | 노출 기간 안의 배너 |
| GET | `/notices` | 🔓 | 공지 목록 (고정 먼저) |
| GET | `/notices/{id}` | 🔓 | |
| GET | `/store/settings` | 🔓 | 배송비, 무료배송 기준, 고객센터 정보 |

## 관리자 API `/admin` 🛡️

모든 경로에 `ADMIN` 권한이 필요합니다. 상태를 바꾸는 작업은 `order_status_histories`에 기록합니다.

### 대시보드

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/dashboard` | 오늘·이번 주 매출, 주문 수, 상태별 주문 수, 처리 대기 반품, 재고 3개 이하 옵션 |

### 상품

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/products` | 목록. `status`, `category`, `q` 필터 |
| POST | `/admin/products` | 생성 (기본 `DRAFT`) |
| GET | `/admin/products/{id}` | 상세 (색상, 옵션, 이미지 포함) |
| PATCH | `/admin/products/{id}` | 기본 정보, 가격, 상태 수정 |
| DELETE | `/admin/products/{id}` | 주문 이력이 없으면 삭제, 있으면 `HIDDEN` 처리 |
| PUT | `/admin/products/{id}/colors` | 색상 목록 일괄 저장 |
| PUT | `/admin/products/{id}/variants` | 옵션·재고 일괄 저장 `[{colorId, size, sku, stock, active}]` |
| PATCH | `/admin/variants/{id}/stock` | 재고 빠른 수정 `{stock}` 또는 `{delta}` |
| PUT | `/admin/products/{id}/images` | 이미지 순서, 색상 연결 저장 |
| POST | `/admin/uploads/presign` | `{filename, contentType}` → R2 업로드용 URL과 `storageKey` (브라우저가 R2에 직접 업로드) |
| GET/POST | `/admin/categories` | |
| PATCH/DELETE | `/admin/categories/{id}` | 상품이 있으면 삭제 불가 |

### 주문, 배송, 반품

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/orders` | 목록. `status`, `from`, `to`, `q`(주문번호, 이름, 연락처) |
| GET | `/admin/orders/{orderNumber}` | 상세 + 결제 원본 + 상태 이력 |
| PATCH | `/admin/orders/{orderNumber}/status` | `{status, reason}`. 허용된 다음 상태로만 변경 |
| POST | `/admin/orders/{orderNumber}/shipment` | `{carrier, trackingNumber}` → `SHIPPED` |
| POST | `/admin/orders/{orderNumber}/cancel` | `{reason}` → PG 환불, 재고 복구 |
| GET | `/admin/orders/export?from=&to=` | 택배 송장 출력용 CSV |
| GET | `/admin/claims` | 반품·교환 목록. `status` 필터 |
| PATCH | `/admin/claims/{id}` | `{status, returnShippingFee, refundAmount}`. `COMPLETED`이면 부분 환불과 재고 복구 |

### 회원, 리뷰, 쿠폰, 화면

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/users` | 목록. `q`, `role` |
| GET | `/admin/users/{id}` | 상세 + 주문 요약 |
| GET | `/admin/reviews` | 목록. `rating`, `status` |
| PATCH | `/admin/reviews/{id}` | `{status}` 숨김/노출 |
| GET/POST | `/admin/coupons` | |
| PATCH | `/admin/coupons/{id}` | 비활성화 포함 (사용된 쿠폰은 삭제 불가) |
| GET/POST | `/admin/banners` | |
| PATCH/DELETE | `/admin/banners/{id}` | |
| PUT | `/admin/banners/order` | 순서 일괄 변경 `[id, …]` |
| GET/POST | `/admin/notices` | |
| PATCH/DELETE | `/admin/notices/{id}` | |
| GET/PUT | `/admin/settings` | 배송비, 무료배송 기준, 고객센터 정보 |

## 백엔드 패키지 구조

```
com.tukfit
├─ global/        설정, 보안, 예외 처리, 공통 응답, Auditing
├─ auth/          로그인, JWT, OAuth2, refresh token
├─ user/          회원, 배송지
├─ catalog/       카테고리, 상품, 색상, 옵션, 이미지
├─ cart/          장바구니, 위시리스트
├─ coupon/
├─ order/         주문, 주문 상품, 상태 이력, 반품·교환, 배송
├─ payment/       PaymentGateway 인터페이스, PG별 구현, 웹훅
├─ review/
├─ display/       배너, 공지, 스토어 설정
├─ storage/       R2/S3 presigned URL
└─ admin/         관리자 전용 컨트롤러 (서비스는 각 도메인 것을 재사용)
```

각 도메인은 `controller → service → repository(JPA)` 계층을 따르고, 엔티티는 API로 직접 내보내지 않고 DTO(record)로 변환합니다.
