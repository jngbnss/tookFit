# 배포 가이드

서버, 도메인, 사업자등록, PG 계약은 **준비되는 대로 하나씩** 붙이면 됩니다. 각 단계는 서로 독립적이라서 순서대로 하지 않아도 서비스는 계속 동작합니다.

| 준비물 | 없을 때 | 붙이면 |
|---|---|---|
| 서버 | 로컬에서만 실행 | `http://서버IP`로 접속 |
| 도메인 | IP로 접속, HTTP | `https://도메인` |
| R2 | (서버 배포 시 필수) | 상품 이미지 업로드 |
| PG 계약 | 모의 결제(MOCK) | 실제 카드 결제 |
| 카카오·네이버 앱 | 이메일 로그인만 | 소셜 로그인 버튼 표시 |
| 사업자등록 | 하단에 "사업자 정보 준비 중" | 관리자 → 설정에 입력하면 바로 표시 |

## 1. 서버 준비 (한 번)

1. 카페24 가상서버호스팅 신청: **Ubuntu 22.04/24.04**, 메모리 **4GB 이상** 권장
2. root로 접속해서 초기 설정 스크립트 실행

   ```bash
   curl -fsSL https://raw.githubusercontent.com/jngbnss/tukFit/main/infra/scripts/server-setup.sh | bash
   ```

   Docker 설치, `deploy` 계정 생성, 방화벽(22/80/443), 자동 보안 업데이트, 스왑을 설정합니다.

3. 내 PC에서 배포 전용 SSH 키를 만들고, 공개키를 서버에 등록

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/tukfit_deploy -N ""
   # 출력된 공개키를 서버의 /home/deploy/.ssh/authorized_keys 에 추가
   cat ~/.ssh/tukfit_deploy.pub
   ```

## 2. 이미지 저장소 (Cloudflare R2)

1. Cloudflare 가입 → R2 → 버킷 `tukfit` 생성
2. 버킷 설정에서 **Public access** 켜기 (r2.dev 주소 또는 `img.도메인` 연결)
3. CORS 규칙 추가 (관리자 화면에서 브라우저가 직접 업로드하기 때문)

   ```json
   [{ "AllowedOrigins": ["https://도메인", "http://서버IP"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"] }]
   ```

4. R2 API 토큰(읽기·쓰기) 생성 → Access Key, Secret Key 메모

## 3. 서버 환경변수

```bash
ssh deploy@서버IP
cd /opt/tukfit
# 처음 배포 전에는 파일이 없으니 저장소의 infra/.env.example 내용을 붙여넣는다
nano .env && chmod 600 .env
```

최소한 `SITE_URL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `S3_*`를 채웁니다.
비밀값은 `openssl rand -base64 48`로 만드세요.

## 4. 자동 배포 연결 (GitHub)

저장소 **Settings → Secrets and variables → Actions**

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `SSH_HOST` | 서버 IP |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_PRIVATE_KEY` | `~/.ssh/tukfit_deploy` 파일 내용 전체 |
| Secret | `SSH_PORT` | (22가 아니면) |
| Variable | `DEPLOY_ENABLED` | `true` |
| Variable | `SITE_URL` | 접속 주소 (배포 기록에 링크로 표시) |

이제 `main`에 push하면: 테스트 → Docker 이미지 빌드(GHCR) → 서버 배포 → 헬스체크까지 자동으로 진행합니다.
헬스체크에 실패하면 직전 버전으로 자동 롤백합니다. 수동으로 다시 돌리려면 Actions → **App CI/CD → Run workflow**.

## 5. 도메인 + HTTPS

1. 도메인 DNS에 A 레코드 두 개: `@` → 서버 IP, `www` → 서버 IP
2. `.env`에 `DOMAIN=도메인` 입력
3. 서버에서 인증서 발급 (자동으로 HTTPS 전환, `SITE_URL`과 `COOKIE_SECURE`도 바꿔줌)

   ```bash
   /opt/tukfit/scripts/issue-cert.sh 내이메일@example.com
   ```

4. GitHub 변수 `SITE_URL`도 `https://도메인`으로 수정

인증서는 certbot 컨테이너가 자동 갱신합니다.

## 6. 결제 (PG 계약 후)

1. 토스페이먼츠 가입 → 상점 심사 → **라이브 키** 발급 (개발 중에는 테스트 키로 먼저 확인)
2. `.env` 수정 후 재시작

   ```bash
   PAYMENT_PROVIDER=TOSS
   TOSS_CLIENT_KEY=live_ck_...
   TOSS_SECRET_KEY=live_sk_...
   ```

   ```bash
   cd /opt/tukfit && docker compose --env-file .env up -d backend
   ```

3. 토스페이먼츠 개발자센터 → 웹훅 URL: `https://도메인/api/v1/payments/webhook/toss`
4. 소액 실결제 → 관리자 화면에서 취소 → 환불 확인

## 7. 소셜 로그인

| | 카카오 developers | 네이버 developers |
|---|---|---|
| Redirect URI | `https://도메인/login/oauth2/code/kakao` | `https://도메인/login/oauth2/code/naver` |
| 동의 항목 | 닉네임, 이메일(선택) | 이름, 이메일 |
| `.env` | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |

입력 후 `docker compose --env-file .env up -d backend`. 키가 있는 버튼만 로그인 화면에 나타납니다.

## 8. 사업자 정보

사업자등록과 통신판매업 신고가 끝나면 **관리자 → 설정**에서 상호, 대표자, 사업자번호, 통신판매업 신고번호, 주소, 개인정보보호책임자를 입력합니다. 재배포 없이 바로 사이트 하단에 표시됩니다.

## 9. 백업

```bash
crontab -e
0 4 * * * /opt/tukfit/scripts/backup.sh >> /opt/tukfit/backups/backup.log 2>&1
```

매일 새벽 4시에 DB를 백업합니다. 서버에 7일치를 보관하고, `.env`의 `BACKUP_S3_BUCKET`이 있으면 R2에도 올립니다.
**오픈 전에 복구를 한 번 연습해보세요.**

```bash
docker compose --env-file .env exec -T postgres pg_restore -U tukfit -d tukfit --clean < backups/파일.dump
```

## 자주 쓰는 명령 (서버의 /opt/tukfit)

```bash
docker compose --env-file .env ps                 # 상태
docker compose --env-file .env logs -f backend    # 로그
docker compose --env-file .env restart backend    # 재시작
./scripts/deploy.sh <커밋 SHA>                     # 특정 버전으로 배포·롤백
```
