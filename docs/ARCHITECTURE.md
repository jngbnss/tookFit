# TUK FIT 쇼핑몰 아키텍처

남성 의류 쇼핑몰(상품 약 50개로 시작)을 직접 개발·운영하기 위한 아키텍처 결정 문서입니다.
현재 저장소의 React/Vite 사이트는 디자인 프로토타입으로 사용합니다.

## 결정 요약

| 항목 | 결정 | 이유 |
|---|---|---|
| 프론트엔드 | Next.js | 쇼핑몰은 SEO와 링크 미리보기가 중요함. 기존 React 컴포넌트 재활용 |
| 백엔드 | Java Spring Boot | 정석적인 계층 구조와 검증된 생태계 |
| DB | PostgreSQL | JPA와 궁합이 좋고 기능이 풍부함 |
| ORM | Spring Data JPA (Hibernate) | Spring 표준 |
| 인프라 | 카페24 가상서버호스팅(VPS) + Docker Compose | 국내 서버라 접속이 빠름. 서버 한 대에 전체 스택을 올림 |
| 이미지 저장 | 오브젝트 스토리지 (Cloudflare R2 또는 AWS S3) | VPS 용량·트래픽 절약, 서버 장애와 분리 |
| 로그인 | 소셜(카카오·네이버) + 이메일 | Spring Security + OAuth2 |
| 관리자 페이지 | Next.js 안 `/admin` 경로 | 컴포넌트·배포를 공유. 권한은 Spring에서 `ADMIN` 역할로 검사 |
| 배포 | GitHub Actions 자동 배포 | push → 테스트 → 이미지 빌드 → VPS 반영 |
| 결제 | **미정** (토스페이먼츠 또는 포트원) | 결제 계층을 인터페이스로 분리해 교체 가능하게 설계 |

## 전체 구조

```
손님 / 관리자
   │ HTTPS
   ▼
카페24 VPS (Docker Compose)
├─ Nginx        도메인 연결, HTTPS(Let's Encrypt), 리버스 프록시
├─ Next.js      손님 화면 + /admin
├─ Spring Boot  REST API, JPA, Spring Security
│     ├─▶ PostgreSQL
│     ├─▶ R2/S3 (상품 이미지)
│     ├─▶ 카카오·네이버 OAuth2
│     └─▶ 결제 PG (미정)
└─ PostgreSQL   (볼륨으로 데이터 유지)
```

## 배포 흐름

```
git push (main)
   │
   ▼
GitHub Actions
   ├─ 테스트 (프론트, 백엔드)
   ├─ Docker 이미지 빌드
   └─ GHCR에 업로드
   │
   ▼ SSH
카페24 VPS
   └─ docker compose pull && docker compose up -d
```

## 설계 원칙

- **역할 분리**: 화면은 Next.js, 비즈니스 로직과 데이터는 Spring이 맡는다. Next.js는 DB에 직접 접근하지 않는다.
- **결제 교체 가능**: Spring에 `PaymentGateway` 인터페이스를 두고 PG사별 구현체를 붙인다.
- **운영자 친화**: 상품, 배너, 공지 등 자주 바뀌는 내용은 개발자 없이 `/admin`에서 수정할 수 있어야 한다.
- **데이터 보호**: PostgreSQL은 정기 백업(dump → 오브젝트 스토리지)한다.

## 운영 준비 (개발과 병행)

- 사업자등록 (홈택스)
- 통신판매업 신고 (사업자등록 이후)
- PG 가입 및 심사 (실제 결제 전까지)
- 도메인 구매 및 DNS 연결

## 다음 작업

1. ~~저장소 폴더 구조~~ ✅
2. ~~DB 테이블 설계~~ ✅ [DATABASE.md](DATABASE.md)
3. ~~API 설계~~ ✅ [API.md](API.md)
4. 이후 전체 일정은 [ROADMAP.md](ROADMAP.md)
