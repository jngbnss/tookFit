#!/usr/bin/env bash
# PostgreSQL 백업. 서버 crontab에 등록 (매일 새벽 4시):
#   0 4 * * * /opt/tukfit/scripts/backup.sh >> /opt/tukfit/backups/backup.log 2>&1
# 서버에 7일치를 보관하고, BACKUP_S3_BUCKET이 있으면 R2에도 올린다.
# 복구: docker compose exec -T postgres pg_restore -U tukfit -d tukfit --clean < 파일.dump
set -euo pipefail

cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

STAMP=$(date +%Y%m%d-%H%M%S)
FILE="backups/tukfit-$STAMP.dump"

docker compose --env-file .env exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$FILE"
echo "$(date '+%F %T') 백업 생성: $FILE ($(du -h "$FILE" | cut -f1))"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" -e AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
    -e AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
    -v "$PWD/backups:/backups:ro" amazon/aws-cli:2.27.0 \
    --endpoint-url "$S3_ENDPOINT" s3 cp "/$FILE" "s3://$BACKUP_S3_BUCKET/db/$(basename "$FILE")" --only-show-errors
  echo "$(date '+%F %T') 업로드 완료: s3://$BACKUP_S3_BUCKET/db/"
fi

find backups -name 'tukfit-*.dump' -mtime +7 -delete
