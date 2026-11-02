#!/usr/bin/env bash
# One-time server setup for mycv.coffeesos.online. Run as root:
#   sudo bash /root/session_manager_workspaces/my-cv/deploy/install.sh
# Afterwards, non-root deploys work with: bash deploy/deploy.sh
set -euo pipefail

DOMAIN=mycv.coffeesos.online
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="/var/www/$DOMAIN"
DEPLOY_USER="${DEPLOY_USER:-sm}"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }
[ -d "$PROJECT_DIR/dist" ] || { echo "dist/ not found. Run 'npm run build' in $PROJECT_DIR first."; exit 1; }

echo "==> Web root $WEB_ROOT (owned by $DEPLOY_USER so future deploys need no sudo)"
mkdir -p "$WEB_ROOT"
rsync -a --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$WEB_ROOT"

echo "==> nginx config"
install -m 644 "$PROJECT_DIR/deploy/nginx/$DOMAIN.conf" "/etc/nginx/conf.d/$DOMAIN.conf"
nginx -t
systemctl reload nginx

echo "==> TLS certificate (Let's Encrypt)"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "certificate already exists, skipping certbot"
else
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos \
    --email "${CERTBOT_EMAIL:-auduongvanhieu@gmail.com}" || {
      echo "certbot failed. Make sure the DNS A record $DOMAIN -> $(curl -s -4 ifconfig.me) exists, then re-run this script."
      exit 1
    }
fi

echo "==> Done: https://$DOMAIN"
