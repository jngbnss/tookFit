#!/usr/bin/env bash
# 서버에서 실행: 지정한 이미지 태그로 서비스를 교체한다. GitHub Actions가 SSH로 호출한다.
#   ./scripts/deploy.sh <image-tag>
set -euo pipefail

cd "$(dirname "$0")/.."
TAG="${1:?image tag required}"

if [ ! -f .env ]; then
  echo ".env 가 없습니다. infra/.env.example 을 참고해 먼저 작성하세요." >&2
  exit 1
fi

# 롤백할 수 있게 직전 태그를 기록해 둔다.
grep -E '^IMAGE_TAG=' .env | cut -d= -f2 > .previous-tag || true
if grep -qE '^IMAGE_TAG=' .env; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" .env
else
  echo "IMAGE_TAG=$TAG" >> .env
fi

docker compose --env-file .env pull backend frontend
docker compose --env-file .env up -d --remove-orphans

echo "==> 헬스체크 대기"
for i in $(seq 1 40); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q backend)" 2>/dev/null || echo starting)
  if [ "$status" = healthy ]; then
    echo "배포 완료: $TAG"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 5
done

echo "백엔드가 정상 상태가 되지 않았습니다. 이전 버전($(cat .previous-tag))으로 되돌립니다." >&2
docker compose logs --tail 100 backend >&2 || true
PREV=$(cat .previous-tag)
if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$PREV/" .env
  docker compose --env-file .env up -d
fi
exit 1
