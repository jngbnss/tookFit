# 계약 메모 (프론트 → 백엔드)

`docs/API-CONTRACT.md`에 정해지지 않았거나 애매해서 프론트가 가정한 것들입니다. 백엔드와 맞춰보고 계약 문서에 반영해주세요.

1. **관리자 목록 응답 형태**: `GET /admin/coupons`, `GET /admin/banners`는 배열인지 `Page`인지 정해지지 않았습니다. 프론트는 둘 다 받습니다(`asItems`). `GET /admin/notices`, `/admin/products`, `/admin/orders`, `/admin/claims`, `/admin/users`, `/admin/reviews`는 `Page`로 가정했습니다. `GET /admin/categories`는 배열입니다(계약대로).
2. **`GET /me/reviews` 응답**: 계약에 없어서 `Page<Review & { productName, productSlug }>`로 가정했습니다. 상품명이 없으면 링크 없이 표시합니다.
3. **목록 필터용 사이즈·색상 후보**: 전체 사이즈·색상 목록 API가 없어서 사이즈는 고정 목록(S~XL, FREE, 28~36, 250~290), 색상은 현재 결과에 있는 색상 이름으로 만듭니다. 필요하면 `GET /products/facets?collection=&category=` 같은 API를 추가하면 좋습니다.
4. **refresh 쿠키 경로**: 프론트는 refresh 쿠키가 `/api/v1/auth` 같은 경로로 제한되어 있어도 동작하도록, 페이지 이동 때 쿠키를 직접 보지 않고 `/me` → 401이면 `/auth/refresh` 한 번 시도로 로그인 여부를 판단합니다. access 쿠키가 만료되어 아예 없을 때 `/me`가 `UNAUTHORIZED`를 줘도 첫 로딩에서는 refresh를 시도합니다.
5. **CSRF 만료 재시도**: 403 응답의 `code`가 `CSRF_INVALID`이면 토큰을 새로 받아 한 번 재시도합니다. 백엔드의 CSRF 실패 코드가 다르면 알려주세요.
6. **관리자 회원 검색**: 주문 상세의 "회원 보기"는 `/admin/users?q=<이메일 또는 이름>`로 이동합니다. `GET /admin/users/{id}` 전용 화면은 아직 없습니다.
7. **바로 구매**: `POST /orders`에 `fromCart: false`로 보냅니다. 장바구니 주문은 `fromCart: true`이며, 결제 승인 후 백엔드가 장바구니에서 해당 옵션을 지운다고 가정했습니다.
8. **교환 옵션 선택**: 교환 신청에서 `exchangeVariantId`는 보내지 않습니다(같은 옵션 교환). 다른 옵션 교환은 사유에 적도록 안내합니다.
9. **결제 실패 기록**: `/checkout/fail`은 로그인 없이도 열리며, `POST /payments/fail`이 401이어도 무시합니다.
10. **배너 순서 변경**: `PUT /admin/banners/order`에 같은 위치(position)의 배너 id만 순서대로 보냅니다.
11. **주문 CSV**: `GET /admin/orders/export`를 `<a download>` 링크로 엽니다(쿠키 인증 GET). `Content-Disposition`에 파일 이름을 넣어주세요.
12. **업로드 PUT**: `uploadUrl`로 PUT할 때 `Content-Type`(파일 형식)과 presign 응답의 `headers`를 함께 보냅니다. presign 서명에 `Content-Type`을 포함했다면 같은 값이어야 합니다. 로컬 SeaweedFS(8333)는 CORS 허용(`-s3.allowedOrigins=*`)이 필요합니다.

## 통합 확인 결과 (2026-10-21, 백엔드 :8081 연결)

- 동작 확인: 로그인 → 장바구니 → 주문 미리보기(쿠폰 TUK10) → 주문 생성 → 모의 결제 승인(PAID) → 장바구니 비워짐 → 주문 취소, 관리자 대시보드·상품·설정·CSV·presign 업로드(PUT 200, 공개 URL 200), 관리자 페이지 서버 확인(일반 회원은 / 로 이동).
- 백엔드 확인 필요: `GET /admin/orders`, `GET /admin/users`가 500 `INTERNAL_ERROR`를 돌려줬습니다.
- `GET /admin/coupons`, `GET /admin/banners`는 배열을 돌려줍니다 (프론트는 배열/Page 모두 처리).
