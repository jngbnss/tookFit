# backend

TUK FIT 쇼핑몰 API. Spring Boot 4.1 · Java 21 · Spring Data JPA · PostgreSQL · Flyway · Spring Security(JWT 쿠키 + OAuth2).

- 설계: [docs/API.md](../docs/API.md), [docs/API-CONTRACT.md](../docs/API-CONTRACT.md), [docs/DATABASE.md](../docs/DATABASE.md)
- 계약과 다른 점: [CONTRACT-NOTES.md](CONTRACT-NOTES.md)

## 로컬 실행

```bash
# 1) 저장소 루트에서 DB(5433)와 이미지 저장소(8333) 띄우기
docker compose -f infra/docker-compose.dev.yml up -d

# 2) backend/ 에서 dev 프로필로 실행 → http://localhost:8081
./gradlew bootRun --args='--spring.profiles.active=dev'
```

- DB가 비어 있으면 개발용 데이터가 자동으로 들어갑니다: 상품 32개, 카테고리 8개, 쿠폰 `TUK10`·`WELCOME5000`, 배너, 공지, 배송 완료 주문 1건.
  - 관리자 `admin@tukfit.local` / `admin1234!`
  - 회원 `user@tukfit.local` / `user1234!`
- API 문서(Swagger): http://localhost:8081/api/v1/docs
- 결제는 모의 결제(MOCK)로 동작합니다. 실제 돈은 오가지 않습니다.
- 개발 DB를 처음부터 다시 만들려면: `docker compose -f infra/docker-compose.dev.yml down -v` 후 다시 `up -d`.
- 시드 SQL을 다시 만들려면(프로토타입 상품 데이터가 바뀌었을 때) 저장소 루트에서 `node backend/scripts/generate-dev-seed.mjs`.

## 테스트

```bash
./gradlew test      # Docker 필요 (Testcontainers가 PostgreSQL을 띄움)
./gradlew build     # 테스트 + 실행 jar
```

통합 테스트는 실제 서버를 랜덤 포트로 띄우고 쿠키·CSRF까지 브라우저처럼 요청합니다: 상품 필터, 가입/로그인/재발급/로그아웃, CSRF, 장바구니 합치기·수량 한도, 쿠폰·배송비 계산, 모의 결제 승인 → 재고 차감, 금액 위조 422, 마지막 1개 동시 결제, 취소 환불·재고 복구, 관리자 권한, 반품 부분 환불, 리뷰 작성 조건, 관리자 목록·검색, 상품 편집.

## Docker 이미지

```bash
docker build -t tukfit-backend ./backend
```

- 비루트 사용자로 실행, 포트 8080, 헬스체크 `GET /actuator/health`(이미지에 curl 포함)
- `JAVA_OPTS` 기본값 `-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError`

## 환경변수 (운영)

서버, 도메인, 사업자등록, PG 계약이 준비되면 **아래 값만 넣으면** 됩니다. 코드는 바꿀 필요가 없습니다.

| 변수 | 필수 | 설명 |
|---|---|---|
| `DB_URL` | ✅ | `jdbc:postgresql://postgres:5432/tukfit` |
| `DB_USERNAME`, `DB_PASSWORD` | ✅ | |
| `JWT_SECRET` | ✅ | 32바이트 이상 임의 문자열 (`openssl rand -base64 48`) |
| `APP_FRONTEND_URL` | ✅ | `https://도메인` — 소셜 로그인 후 돌아갈 주소, 비밀번호 재설정 링크 |
| `COOKIE_SECURE` | | 기본 `true`. HTTPS 적용 전 IP로 접속할 때만 `false` |
| `COOKIE_DOMAIN` | | 보통 비워 둠 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | 처음 뜰 때 관리자 계정 생성 (비밀번호 10자 이상). 이미 있으면 무시 |
| `S3_ENDPOINT` | | R2: `https://<계정ID>.r2.cloudflarestorage.com` |
| `S3_REGION` | | R2는 `auto` (기본값) |
| `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | | 비어 있으면 관리자 이미지 업로드만 503 |
| `S3_PUBLIC_BASE_URL` | | 이미지 공개 주소 (R2 공개 버킷 도메인) |
| `S3_PATH_STYLE` | | 기본 `true` |
| `PAYMENT_PROVIDER` | | `MOCK`(기본) 또는 `TOSS` |
| `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | TOSS일 때 | 토스페이먼츠 키. TOSS인데 비어 있으면 서버가 뜨지 않음 |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | | 넣으면 카카오 로그인이 켜짐 |
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | | 넣으면 네이버 로그인이 켜짐 |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | | 비밀번호 재설정 메일. 비어 있으면 서버 로그에 링크를 남김 |
| `DOCS_PUBLIC` | | `true`면 Swagger를 누구나 볼 수 있음 (기본: 관리자만) |
| `DB_POOL_SIZE`, `PORT` | | 기본 10, 8080 |

### 외부 콘솔에 등록할 주소

- 카카오·네이버 Redirect URI: `https://도메인/login/oauth2/code/kakao`, `https://도메인/login/oauth2/code/naver`
- 토스페이먼츠 웹훅: `https://도메인/api/v1/payments/webhook/toss`
- Nginx는 `/api`, `/oauth2`, `/login/oauth2`를 백엔드로 보내고 `X-Forwarded-Proto/Host/For`를 넘겨야 합니다 (`server.forward-headers-strategy=native`).

## 구조

```
com.tukfit
├─ global/    설정, 보안(SecurityConfig), 예외 처리, 공통 응답, 개발 시드
├─ auth/      로그인, JWT, refresh token, 비밀번호 재설정, oauth/(카카오·네이버)
├─ user/      회원, 배송지
├─ catalog/   카테고리, 상품, 색상, 옵션, 이미지, 재고(Inventory)
├─ cart/      장바구니, 위시리스트
├─ coupon/
├─ order/     주문, 금액 계산, 상태 이력, 배송, 반품·교환, 만료 스케줄러
├─ payment/   PaymentGateway(Mock, Toss), 승인·보상 취소, 환불, 웹훅
├─ review/
├─ display/   배너, 공지, 스토어 설정
├─ storage/   R2/S3 presigned URL, 이미지 URL
└─ admin/     관리자 API
```

결제 흐름: 주문 생성(PENDING_PAYMENT) → PG 결제창 → `/payments/confirm`에서 금액 검증 → PG 승인 → 한 트랜잭션에서 재고 차감·쿠폰 사용·PAID. 재고가 모자라면 PG 결제를 바로 취소합니다. 30분 안에 결제하지 않은 주문은 EXPIRED.
