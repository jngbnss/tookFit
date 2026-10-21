#!/usr/bin/env bash
# 도메인 DNS가 서버 IP를 가리킨 뒤 한 번 실행: Let's Encrypt 인증서를 발급하고 HTTPS로 전환한다.
#   ./scripts/issue-cert.sh you@example.com
# 갱신은 certbot 컨테이너가 자동으로 한다.
set -euo pipefail

cd "$(dirname "$0")/.."
EMAIL="${1:?인증서 알림을 받을 이메일을 입력하세요}"
DOMAIN=$(grep -E '^DOMAIN=' .env | cut -d= -f2)
if [ -z "$DOMAIN" ]; then
  echo ".env 의 DOMAIN 을 먼저 채우세요 (예: tukfit.com)" >&2
  exit 1
fi

docker compose --env-file .env run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

# HTTPS 설정으로 다시 시작
docker compose --env-file .env restart nginx

sed -i "s#^SITE_URL=.*#SITE_URL=https://$DOMAIN#; s#^COOKIE_SECURE=.*#COOKIE_SECURE=true#" .env
docker compose --env-file .env up -d backend frontend

echo "HTTPS 적용 완료: https://$DOMAIN"
echo "카카오·네이버 개발자 콘솔의 Redirect URI도 https://$DOMAIN/login/oauth2/code/... 로 바꾸세요."
