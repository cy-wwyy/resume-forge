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

echo "› 构建离线模板 + 主应用（base=${BASE_PATH}）"
npm run build:standalone
npx vite build --base="$BASE_PATH"

SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
fi

echo "› 同步到 ${REMOTE}:${REMOTE_DIR}"
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete -e "ssh $SSH_OPTS" dist/ "${REMOTE}:${REMOTE_DIR}/"
else
  # 没有 rsync 的机器走 tar over ssh，效果一样（不删旧文件）
  echo "  本机没有 rsync，改用 tar 传输"
  tar czf - -C dist . | ssh $SSH_OPTS "$REMOTE" "mkdir -p '$REMOTE_DIR' && tar xzf - -C '$REMOTE_DIR'"
fi

echo "✓ 完成"
