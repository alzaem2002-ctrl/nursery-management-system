#!/bin/bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════════
#  Cloudflare Tunnel Setup Script with API Token Authentication
#  إعداد نفق Cloudflare الدائم باستخدام API Token
# ════════════════════════════════════════════════════════════════════

# ════════════════ إعدادات أساسية ════════════════
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-OWyabQ4w51MuQFB-8g6mAPz5WGaFh2KNP1z3iOVJ}"
ACCOUNT_ID="${ACCOUNT_ID:-}"                         # سيتم جلبه تلقائياً إذا كان فارغاً
DOMAIN="${DOMAIN:-dari-system.com}"                  # نطاقك
SUBDOMAIN="${SUBDOMAIN:-nursery}"                    # الاسم الفرعي المطلوب
TUNNEL_NAME="${TUNNEL_NAME:-nursery-prod}"
PORT="${PORT:-3001}"
LOGDIR="/opt/nursery-runtime/logs"
HOSTNAME="$SUBDOMAIN.$DOMAIN"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ════════════════ فحص المتغيرات الأساسية ════════════════
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  error "❌ مفقود CLOUDFLARE_API_TOKEN"
  echo "أضفه عبر:"
  echo "export CLOUDFLARE_API_TOKEN=<your-token>"
  exit 1
fi

# ════════════════ جلب Account ID تلقائياً إذا لم يكن محدداً ════════════════
if [ -z "$ACCOUNT_ID" ]; then
  info "🔍 جلب Account ID من Cloudflare..."
  ACCOUNT_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')
  
  if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" == "null" ]; then
    error "❌ فشل في جلب Account ID. تحقق من صلاحيات الـ Token."
    exit 1
  fi
  info "✅ Account ID: $ACCOUNT_ID"
fi

# ════════════════ إنشاء المجلدات المطلوبة ════════════════
sudo mkdir -p "$LOGDIR"
sudo chown -R $USER:$USER "$LOGDIR"
CFG_DIR="$HOME/.cloudflared"
mkdir -p "$CFG_DIR"
CRED_FILE="$CFG_DIR/${TUNNEL_NAME}.json"
CONFIG_FILE="$CFG_DIR/config.yml"

# ════════════════ إنشاء النفق عبر Cloudflare API ════════════════
if [ ! -f "$CRED_FILE" ]; then
  info "⚙️ إنشاء نفق جديد عبر API: $TUNNEL_NAME"
  
  RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"name\":\"$TUNNEL_NAME\",\"tunnel_secret\":\"$(openssl rand -base64 32)\"}")
  
  TUNNEL_ID=$(echo "$RESPONSE" | jq -r '.result.id')
  TUNNEL_SECRET=$(echo "$RESPONSE" | jq -r '.result.tunnel_secret')
  
  if [ -z "$TUNNEL_ID" ] || [ "$TUNNEL_ID" == "null" ]; then
    error "❌ فشل في إنشاء النفق:"
    echo "$RESPONSE" | jq .
    exit 1
  fi
  
  info "✅ Tunnel ID: $TUNNEL_ID"
  
  # إنشاء ملف الاعتماد
  cat > "$CRED_FILE" <<EOF
{
  "AccountTag": "$ACCOUNT_ID",
  "TunnelSecret": "$TUNNEL_SECRET",
  "TunnelID": "$TUNNEL_ID"
}
EOF
  chmod 600 "$CRED_FILE"
else
  info "✅ ملف الاعتماد موجود مسبقاً: $CRED_FILE"
fi

# ════════════════ إنشاء ملف التكوين ════════════════
info "📝 إنشاء ملف التكوين: $CONFIG_FILE"
cat > "$CONFIG_FILE" <<YML
tunnel: $TUNNEL_NAME
credentials-file: $CRED_FILE
ingress:
  - hostname: $HOSTNAME
    service: http://localhost:$PORT
  - service: http_status:404
YML

# ════════════════ ربط النطاق عبر DNS (CNAME) ════════════════
info "🔗 ربط DNS للنطاق: $HOSTNAME"

# جلب Zone ID
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" == "null" ]; then
  warn "⚠️ لم يتم العثور على النطاق $DOMAIN في حسابك"
  warn "تأكد من أن النطاق مضاف إلى Cloudflare"
else
  # حذف السجل القديم إن وجد
  OLD_RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$HOSTNAME" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')
  
  if [ "$OLD_RECORD_ID" != "null" ] && [ -n "$OLD_RECORD_ID" ]; then
    info "🗑️ حذف السجل القديم..."
    curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$OLD_RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" >/dev/null
  fi
  
  # إضافة سجل CNAME جديد
  DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"$SUBDOMAIN\",\"content\":\"$(jq -r .TunnelID $CRED_FILE).cfargotunnel.com\",\"ttl\":1,\"proxied\":true}")
  
  if echo "$DNS_RESPONSE" | jq -e '.success' >/dev/null; then
    info "✅ تم ربط DNS بنجاح"
  else
    warn "⚠️ قد يكون هناك مشكلة في ربط DNS:"
    echo "$DNS_RESPONSE" | jq .
  fi
fi

# ════════════════ تشغيل النفق كخدمة دائمة ════════════════
info "🚀 إعداد خدمة systemd..."

sudo tee /etc/systemd/system/cloudflared-nursery.service >/dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel (nursery-prod)
After=network.target

[Service]
Type=simple
User=${USER}
ExecStart=/usr/local/bin/cloudflared tunnel --config $CONFIG_FILE run
Restart=always
RestartSec=5
StandardOutput=append:$LOGDIR/cloudflared.stdout.log
StandardError=append:$LOGDIR/cloudflared.stderr.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudflared-nursery.service
sudo systemctl restart cloudflared-nursery.service

# ════════════════ التحقق من الحالة ════════════════
sleep 3
if sudo systemctl is-active --quiet cloudflared-nursery.service; then
  info "✅ الخدمة تعمل بنجاح!"
else
  warn "⚠️ الخدمة قد لا تعمل بشكل صحيح. تحقق من السجلات:"
  echo "sudo journalctl -u cloudflared-nursery -n 50"
fi

# ════════════════ النتيجة النهائية ════════════════
echo ""
echo "════════════════════════════════════════════════════════"
info "✅ تم إعداد النفق الآمن عبر Cloudflare API بنجاح"
echo ""
echo "🌍 رابطك الآن: https://$HOSTNAME"
echo "📂 السجلات: $LOGDIR"
echo "🔍 راقب الخدمة: sudo journalctl -u cloudflared-nursery -f"
echo "⏸️  إيقاف الخدمة: sudo systemctl stop cloudflared-nursery"
echo "▶️  تشغيل الخدمة: sudo systemctl start cloudflared-nursery"
echo "🔄 إعادة تشغيل: sudo systemctl restart cloudflared-nursery"
echo "════════════════════════════════════════════════════════"
