#!/usr/bin/env bash
# Server setup for mycv.coffeesos.online (idempotent). Run as root:
#   sudo bash /root/session_manager_workspaces/my-cv/deploy/install.sh
# Optional: GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com ANTHROPIC_API_KEY=sk-ant-... sudo -E bash deploy/install.sh
# Afterwards, non-root deploys work with: bash deploy/deploy.sh
set -euo pipefail

DOMAIN=mycv.coffeesos.online
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="/var/www/$DOMAIN"
DEPLOY_USER="${DEPLOY_USER:-sm}"
DATA_DIR=/var/lib/mycv
ENV_FILE=/etc/mycv/mycv.env

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }
[ -d "$PROJECT_DIR/dist" ] || { echo "dist/ not found. Run 'bash deploy/deploy.sh' (or npm run build) in $PROJECT_DIR first."; exit 1; }
[ -x "$PROJECT_DIR/server/bin/mycv-server" ] || { echo "server/bin/mycv-server not found. Run 'bash deploy/deploy.sh' first."; exit 1; }

echo "==> Web root $WEB_ROOT (owned by $DEPLOY_USER so future deploys need no sudo)"
mkdir -p "$WEB_ROOT"
rsync -a --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$WEB_ROOT"

echo "==> API data dir $DATA_DIR and env file $ENV_FILE"
mkdir -p "$DATA_DIR" /etc/mycv
chown "$DEPLOY_USER:$DEPLOY_USER" "$DATA_DIR"
if [ ! -f "$ENV_FILE" ]; then
  install -m 640 -o root -g "$DEPLOY_USER" "$PROJECT_DIR/deploy/mycv.env.example" "$ENV_FILE"
fi
if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  sed -i "s|^MYCV_GOOGLE_CLIENT_ID=.*|MYCV_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$ENV_FILE"
fi
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  grep -q '^ANTHROPIC_API_KEY=' "$ENV_FILE" || echo "ANTHROPIC_API_KEY=" >> "$ENV_FILE"
  sed -i "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY|" "$ENV_FILE"
fi
if ! grep -q '^ANTHROPIC_API_KEY=.\+' "$ENV_FILE"; then
  echo "    NOTE: ANTHROPIC_API_KEY is empty in $ENV_FILE -> AI CV extraction stays disabled until you set it and restart mycv-server."
fi
if ! grep -q '^MYCV_GOOGLE_CLIENT_ID=.\+' "$ENV_FILE"; then
  echo "    NOTE: MYCV_GOOGLE_CLIENT_ID is empty in $ENV_FILE -> Google login stays disabled until you set it and restart mycv-server."
fi

echo "==> systemd service mycv-server"
install -m 644 "$PROJECT_DIR/deploy/mycv-server.service" /etc/systemd/system/mycv-server.service
systemctl daemon-reload
systemctl enable --now mycv-server
systemctl restart mycv-server
sleep 1
curl -fsS http://127.0.0.1:7801/api/healthz >/dev/null && echo "    API healthy" || { echo "    API not responding; see: journalctl -u mycv-server -n 50"; exit 1; }

echo "==> sudoers: let $DEPLOY_USER restart the API without a password"
SUDOERS=/etc/sudoers.d/mycv-deploy
echo "$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart mycv-server, /usr/bin/systemctl status mycv-server, /usr/bin/journalctl -u mycv-server *" > "$SUDOERS"
chmod 440 "$SUDOERS"
visudo -cf "$SUDOERS" >/dev/null

echo "==> nginx config"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  install -m 644 "$PROJECT_DIR/deploy/nginx/$DOMAIN.conf" "/etc/nginx/conf.d/$DOMAIN.conf"
else
  # First install on a fresh server: start with a plain HTTP block so nginx can load
  # before the certificate exists, then let certbot add the TLS block.
  cat > "/etc/nginx/conf.d/$DOMAIN.conf" <<NGINX
upstream mycv_api { server 127.0.0.1:7801; keepalive 16; }
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    root $WEB_ROOT;
    index index.html;
    client_max_body_size 5m;
    location /api/ { proxy_pass http://mycv_api; proxy_http_version 1.1; proxy_set_header Connection ""; proxy_set_header Host \$host; proxy_set_header X-Forwarded-Proto \$scheme; }
    location /assets/ { try_files \$uri =404; add_header Cache-Control "public, max-age=31536000, immutable"; }
    location / { try_files \$uri \$uri/ /index.html; add_header Cache-Control "no-cache"; }
}
NGINX
  nginx -t && systemctl reload nginx
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos \
    --email "${CERTBOT_EMAIL:-auduongvanhieu@gmail.com}" || {
      echo "certbot failed. Make sure the DNS A record $DOMAIN -> $(curl -s -4 ifconfig.me) exists, then re-run this script."
      exit 1
    }
  # Now the certificate exists: install the full config from the repo.
  install -m 644 "$PROJECT_DIR/deploy/nginx/$DOMAIN.conf" "/etc/nginx/conf.d/$DOMAIN.conf"
fi
nginx -t
systemctl reload nginx

echo "==> Done: https://$DOMAIN"
