#!/usr/bin/env bash
# 可选的一键部署：构建后 rsync 到自己的静态服务器。
# 用法：
#   REMOTE=user@host REMOTE_DIR=/var/www/resume npm run deploy
#   BASE_PATH=/resume/ SSH_KEY=~/.ssh/id_ed25519 REMOTE=... npm run deploy
set -euo pipefail

: "${REMOTE:?请设置 REMOTE=user@host}"
: "${REMOTE_DIR:?请设置 REMOTE_DIR=/服务器上的目标目录}"
BASE_PATH="${BASE_PATH:-/}"
SSH_KEY="${SSH_KEY:-}"

echo "› 构建（base=${BASE_PATH}）"
npx vite build --base="$BASE_PATH"

RSYNC_SSH="ssh"
if [ -n "$SSH_KEY" ]; then
  RSYNC_SSH="ssh -i $SSH_KEY"
fi

echo "› 同步到 ${REMOTE}:${REMOTE_DIR}"
rsync -az --delete -e "$RSYNC_SSH" dist/ "${REMOTE}:${REMOTE_DIR}/"

echo "✓ 完成"
