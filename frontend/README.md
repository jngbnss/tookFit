# frontend

TUK FIT 쇼핑몰의 Next.js 앱입니다. 손님 화면과 관리자 화면(`/admin`)을 함께 둡니다.
API 형식은 [docs/API-CONTRACT.md](../docs/API-CONTRACT.md)를 그대로 따릅니다.

## 실행

```bash
# 1) 로컬 DB와 이미지 저장소
docker compose -f infra/docker-compose.dev.yml up -d
# 2) 백엔드 (backend/README.md 참고, 기본 http://localhost:8081)
# 3) 프론트
cd frontend
npm install
npm run dev        # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (3000) |
| `npm run build` / `npm start` | 운영 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm test -- --run` | Vitest (API 클라이언트, 장바구니, 포맷, 컴포넌트) |
| `npm run typecheck` | TypeScript 검사 |

개발용 계정(백엔드 `dev` 프로필): 관리자 `admin@tukfit.local` / `admin1234!`, 회원 `user@tukfit.local` / `user1234!`

## 환경변수

빌드 시점이 아니라 **실행 시점**에 읽습니다. Docker 이미지는 한 번 빌드하고 서버마다 값만 바꿉니다.
`NEXT_PUBLIC_*` 변수는 쓰지 않습니다 (빌드에 고정되기 때문).

| 변수 | 기본값 | 설명 |
|---|---|---|
| `INTERNAL_API_URL` | `http://localhost:8081` | 백엔드 주소. 서버 렌더링 요청과 `/api` 전달에 사용. Docker 안에서는 `http://backend:8080` |
| `SITE_URL` | `http://localhost:3000` | 운영 도메인. 메타 태그, `sitemap.xml`, `robots.txt`, 상품 JSON-LD에 사용 |

브라우저 코드는 도메인을 `window.location`에서 얻습니다 (토스 결제 successUrl/failUrl 등).

## 구조

```
src/
├─ proxy.ts              /api, /oauth2, /login/oauth2 → 백엔드 (요청 시점의 INTERNAL_API_URL)
├─ app/
│  ├─ layout.tsx         테마, 폰트, 스토어 설정, 전역 Provider
│  ├─ (shop)/            손님 화면 (헤더·푸터 레이아웃)
│  │  ├─ page.tsx        메인 (배너, 신상품, 베스트, 카테고리)
│  │  ├─ shop/[collection]  목록: all, new-arrivals, best-sellers, sale, 카테고리 slug (필터·정렬·페이지는 URL)
│  │  ├─ products/[slug] 상세 (색상별 사진, 옵션 재고, 리뷰, 추천, JSON-LD)
│  │  ├─ cart, checkout(/success, /fail)
│  │  ├─ login, signup, password/(forgot|reset)
│  │  ├─ mypage/         내 정보, 주문(취소·교환·반품), 리뷰, 위시리스트, 배송지, 계정
│  │  └─ notices, policy/[slug]
│  ├─ admin/             관리자 (대시보드, 주문, 교환·반품, 상품, 카테고리, 회원, 리뷰, 쿠폰, 배너, 공지, 설정)
│  ├─ sitemap.ts, robots.ts
├─ components/           화면 조각 (providers/: 인증, 장바구니, 위시리스트, 설정, 토스트)
├─ hooks/                useAsync, useUrlState
└─ lib/
   ├─ api/               types.ts(계약), client.ts(브라우저), server.ts(서버), 도메인별 모듈
   ├─ guest-cart.ts      비회원 장바구니 (로그인 시 /me/cart/merge)
   └─ external-scripts.ts  우편번호 검색, 토스페이먼츠 SDK
```

## 동작 메모

- **인증**: 백엔드가 HttpOnly 쿠키로 토큰을 관리합니다. 401 `TOKEN_EXPIRED`면 `/auth/refresh` 후 한 번 재시도합니다. 상태를 바꾸는 요청에는 `XSRF-TOKEN` 쿠키를 `X-XSRF-TOKEN` 헤더로 보냅니다.
- **로그인 필요 화면**(마이페이지, 주문서, 관리자)은 `RequireAuth`가 토큰 재발급까지 시도한 뒤 판단합니다. 실제 권한 검사는 백엔드가 합니다. 관리자 레이아웃은 서버에서 `/me`를 한 번 더 확인합니다.
- **결제**: 백엔드가 주는 `payment.provider`에 따라 `MOCK`이면 결제창 없이 성공 화면으로, `TOSS`면 토스페이먼츠 결제창을 엽니다. PG 키를 서버에 넣기만 하면 프론트 수정 없이 실결제로 바뀝니다.
- **바로 구매**는 장바구니를 거치지 않고 `sessionStorage`로 주문서에 상품을 넘깁니다.
- **이미지**는 외부 저장소(R2/S3) URL이라 `next/image` 대신 `<img>`를 씁니다 (도메인 설정 불필요).
- 디자인은 프로토타입 토큰(`globals.css`)을 옮긴 임시 스타일입니다. 이후 교체 예정입니다.
