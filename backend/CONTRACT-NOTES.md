# 백엔드 계약 메모

`docs/API-CONTRACT.md`와 다르거나, 계약서에 정해지지 않아 백엔드가 정한 부분입니다.

## 응답 형태

| 엔드포인트 | 형태 |
|---|---|
| `GET /admin/coupons` | `Coupon[]` (페이지 아님) |
| `GET /admin/banners?position=` | `AdminBanner[]` (페이지 아님, position·sortOrder 순) |
| `GET /admin/categories` | `(Category & {visible, productCount})[]` |
| `GET /admin/products`, `/admin/orders`, `/admin/claims`, `/admin/users`, `/admin/reviews`, `/admin/notices` | `Page<…>` |
| `GET /admin/users/{id}` | `AdminUser & { recentOrders: OrderSummary[] }` (최근 10건) |
| `GET /me/reviews` | `Page<Review & { productName, productSlug }>` |
| `GET /me/orders` | `Page<OrderSummary>`. 만료(EXPIRED) 주문은 빠진다 |
| `POST /orders/preview` | `items[].id`는 장바구니 id가 아니라 **variantId** (주문서 줄에는 장바구니 id가 없음) |
| `PUT /admin/banners/order` | 요청 `number[]`, 응답 `AdminBanner[]` (전체 목록) |
| `GET /admin/orders/export` | `text/csv; charset=UTF-8`, BOM 포함, `Content-Disposition: attachment; filename="orders-{from}-{to}.csv"` (날짜가 없으면 `all`) |
| `POST /admin/uploads/presign` | 계약대로 `{uploadUrl, storageKey, publicUrl, headers}`. 업로드할 때 `headers`(Content-Type, Cache-Control)를 그대로 붙여야 서명이 맞는다 |

## 동작

- **PATCH `/admin/products/{id}`**는 부분 수정이 아니라 `AdminProductRequest` 전체를 받는다 (slug, name, categoryId, price, status 필수).
- **PATCH `/admin/orders/{n}/status`**: `SHIPPED`로 바꾸려면 송장이 먼저 있어야 한다(없으면 409 `ORDER_STATUS_INVALID`). 보통은 `POST …/shipment`가 송장 저장과 `SHIPPED` 전환을 함께 한다. `DELIVERED`는 배송 완료 시각도 기록한다. `CANCELLED`는 취소 API와 같다(환불·재고 복구).
- **반품 완료(`COMPLETED`)**: `refundAmount`를 안 보내면 `단가 × 수량 − returnShippingFee`로 환불한다. 결제 잔액을 넘으면 400.
- **반품 배송비 기본값**: 사유가 `CHANGE_OF_MIND`, `SIZE`면 스토어 설정의 `returnShippingFee`(기본 6,000원), `DEFECT`, `WRONG_ITEM`이면 0.
- **장바구니·주문 `available`**: 상품이 판매 중이고, 옵션이 활성이고, 재고 ≥ 수량일 때 true. 장바구니 합계는 available 항목만 계산한다.
- **쿠폰 회원별 사용 횟수**는 결제된 주문(PAID 이후, 취소 제외) 기준. 쿠폰 사용 수(`usedCount`)는 결제 승인 때 늘고 전체 취소 때 줄어든다.
- **에러 응답의 `fields`**는 검증 오류일 때만 들어간다(그 외에는 키가 없음).
- **CSRF 실패**는 403 `CSRF_INVALID`. `GET /auth/csrf`는 204이며 `XSRF-TOKEN` 쿠키(Path=/, HttpOnly 아님)를 내려준다.
- **토큰 재발급**: refresh 실패 시 401 `UNAUTHORIZED`와 함께 인증 쿠키를 지운다. 30초 안에 같은 refresh 토큰이 다시 오면(탭 여러 개) 401만 주고, 그보다 오래된 토큰 재사용은 탈취로 보고 그 회원의 모든 refresh 토큰을 폐기한다.
- **카카오 로그인**은 `profile_nickname`만 요청한다(이메일은 카카오 비즈 앱 검수 후 `account_email` 추가). 그래서 카카오 회원은 `email`이 null일 수 있다.
- 같은 이메일의 기존 회원과 소셜 계정을 자동으로 합치지 않는다(계정 탈취 방지). 이미 쓰는 이메일이면 소셜 회원의 email은 null.
- **시간**은 UTC ISO-8601(`2026-10-21T12:15:28.958Z`)로 내려간다. 화면에서 KST로 바꿔 표시한다.
- **이미지 URL**: 저장 키가 이미 `http(s)://`로 시작하면 그대로 돌려준다.
