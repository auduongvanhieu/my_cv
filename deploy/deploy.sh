#!/usr/bin/env bash
# Build frontend + API and publish. Works without a password once install.sh has run.
set -euo pipefail
export PATH="$HOME/sdk/go/bin:$HOME/sdk/node/bin:$PATH"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="/var/www/mycv.coffeesos.online"

cd "$PROJECT_DIR"
echo "==> frontend"
npm run build
echo "==> api"
(cd server && CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o bin/mycv-server .)

if [ -w "$WEB_ROOT" ]; then
  rsync -a --delete dist/ "$WEB_ROOT/"
  echo "==> published to $WEB_ROOT"
else
  echo "$WEB_ROOT is not writable. Run once as root: sudo bash deploy/install.sh"
  exit 1
fi

if systemctl is-enabled mycv-server >/dev/null 2>&1; then
  sudo -n systemctl restart mycv-server && echo "==> mycv-server restarted" || echo "Could not restart mycv-server (run: sudo systemctl restart mycv-server)"
else
  echo "mycv-server service not installed yet. Run once as root: sudo bash deploy/install.sh"
fi
