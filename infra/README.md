# infra

| 파일 | 용도 |
|---|---|
| `docker-compose.dev.yml` | 로컬 개발: PostgreSQL(5433), S3 호환 저장소 SeaweedFS(8333) + 개발용 이미지 업로드 |
| `docker-compose.yml` | 운영 서버: Nginx, certbot, Next.js, Spring Boot, PostgreSQL |
| `nginx/` | 라우팅 설정. 인증서가 있으면 HTTPS, 없으면 HTTP로 자동 선택 |
| `scripts/server-setup.sh` | 새 서버 초기 설정 (한 번) |
| `scripts/deploy.sh` | 이미지 태그로 배포, 실패 시 롤백 (GitHub Actions가 호출) |
| `scripts/issue-cert.sh` | 도메인 연결 후 HTTPS 인증서 발급 |
| `scripts/backup.sh` | DB 백업 (cron) |
| `.env.example` | 서버 환경변수 목록 |

로컬 개발 환경 실행:

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

서버 배포 절차는 [docs/DEPLOY.md](../docs/DEPLOY.md)를 참고하세요.
