#!/usr/bin/env bash
# 새 Ubuntu 서버(카페24 VPS)를 처음 한 번 준비한다. root로 실행:
#   curl -fsSL https://raw.githubusercontent.com/jngbnss/tukFit/main/infra/scripts/server-setup.sh | bash
set -euo pipefail

APP_DIR=/opt/tukfit
DEPLOY_USER=deploy

echo "==> 패키지 업데이트"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl ufw fail2ban unattended-upgrades

echo "==> Docker 설치"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> 배포 계정 ($DEPLOY_USER)"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /home/$DEPLOY_USER/.ssh
touch /home/$DEPLOY_USER/.ssh/authorized_keys
chown "$DEPLOY_USER:$DEPLOY_USER" /home/$DEPLOY_USER/.ssh/authorized_keys
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

echo "==> 앱 디렉터리 ($APP_DIR)"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/backups"

echo "==> 방화벽: SSH, HTTP, HTTPS만 허용"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 자동 보안 업데이트"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> 스왑 2GB (메모리가 작을 때 빌드·기동 안정성)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

cat <<EOF

완료. 다음 단계:
  1. 로컬 PC에서 만든 배포용 공개키를 /home/$DEPLOY_USER/.ssh/authorized_keys 에 추가
  2. $APP_DIR/.env 작성 (infra/.env.example 참고), chmod 600
  3. GitHub 저장소에 SSH_HOST, SSH_USER, SSH_PRIVATE_KEY 시크릿과 DEPLOY_ENABLED=true 변수 등록
  4. 키 로그인이 되는지 확인한 뒤 /etc/ssh/sshd_config 에서 PasswordAuthentication no 설정
EOF
