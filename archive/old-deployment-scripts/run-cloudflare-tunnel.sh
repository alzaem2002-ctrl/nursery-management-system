#!/bin/bash
# Simple tunnel runner without systemd dependency

CFG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CFG_DIR/config.yml"
LOGDIR="/opt/nursery-runtime/logs"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Configuration file not found: $CONFIG_FILE"
  echo "Run setup-cloudflare-tunnel.sh first!"
  exit 1
fi

echo "🚀 Starting Cloudflare Tunnel..."
echo "📂 Logs: $LOGDIR/cloudflared.log"
echo "⏹️  Press Ctrl+C to stop"
echo ""

mkdir -p "$LOGDIR"
exec /usr/local/bin/cloudflared tunnel --config "$CONFIG_FILE" run 2>&1 | tee -a "$LOGDIR/cloudflared.log"
