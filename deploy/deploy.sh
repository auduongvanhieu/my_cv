#!/usr/bin/env bash
# Build and publish. Works without sudo once install.sh has run (web root is owned by the deploy user).
set -euo pipefail
export PATH="$HOME/sdk/node/bin:$PATH"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="/var/www/mycv.coffeesos.online"

cd "$PROJECT_DIR"
npm run build
if [ -w "$WEB_ROOT" ]; then
  rsync -a --delete dist/ "$WEB_ROOT/"
  echo "Published to $WEB_ROOT"
else
  echo "$WEB_ROOT is not writable. Run once as root: sudo bash deploy/install.sh"
  exit 1
fi
