#!/bin/sh
# nginx 컨테이너 시작 시 실행된다 (docker-compose.yml의 nginx command).
# DOMAIN의 인증서가 있으면 HTTPS 설정을, 없으면 HTTP 설정을 고른다.
set -eu

src=/etc/nginx/tukfit-templates
dst=/etc/nginx/conf.d

rm -f "$dst"/*.conf "$dst"/*.inc
cp "$src/common.conf" "$dst/00-common.conf"
cp "$src/proxy-headers.inc" "$dst/proxy-headers.inc"
cp "$src/locations.conf" "$dst/locations.inc"

if [ -n "${DOMAIN:-}" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  sed "s/__DOMAIN__/$DOMAIN/g" "$src/https.conf" > "$dst/10-site.conf"
  echo "tukfit: HTTPS 설정 사용 ($DOMAIN)"
else
  cp "$src/http.conf" "$dst/10-site.conf"
  echo "tukfit: 인증서가 없어 HTTP 설정 사용"
fi
