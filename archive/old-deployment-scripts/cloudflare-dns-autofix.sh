#!/bin/bash
set -euo pipefail

# === AUTONOMOUS CLOUDFLARE DNS AUTO-FIX & TUNNEL VERIFICATION ===
# This script automatically verifies and fixes DNS records for Cloudflare Tunnel

echo "════════════════════════════════════════════════════════════════════"
echo "🚀 Cloudflare DNS Auto-Fix & Tunnel Verification"
echo "   Autonomous Mode - Priority: Highest"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# === STEP 1: Load Environment ===
source /opt/nursery-runtime/.env 2>/dev/null || true
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-OWyabQ4w51MuQFB-8g6mAPz5WGaFh2KNP1z3iOVJ}"
export ACCOUNT_ID="${ACCOUNT_ID:-d23fe4532560dffb51596e070f1c4afa}"
DOMAIN="${DOMAIN:-dari-system.com}"
SUBDOMAIN="${SUBDOMAIN:-nursery}"
TUNNEL_NAME="${TUNNEL_NAME:-nursery-prod}"
LOGDIR="/opt/nursery-runtime/logs"
sudo mkdir -p "$LOGDIR" 2>/dev/null || mkdir -p "$LOGDIR"
sudo chown -R $USER:$USER "$LOGDIR" 2>/dev/null || true

echo "✅ Step 1: Environment loaded"
echo "   Account ID: $ACCOUNT_ID"
echo "   Domain:     $DOMAIN"
echo "   Subdomain:  $SUBDOMAIN"
echo "   Tunnel:     $TUNNEL_NAME"
echo ""

# === STEP 2: Verify Required Tools ===
echo "📦 Step 2: Verifying required tools..."
MISSING_TOOLS=()
for tool in curl jq cloudflared; do
  if ! command -v $tool >/dev/null 2>&1; then
    MISSING_TOOLS+=("$tool")
    echo "   ⚠️  Missing: $tool"
  else
    echo "   ✅ Found: $tool"
  fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
  exit 1
fi
echo ""

# === STEP 3: Detect Tunnel Target ===
echo "🔎 Step 3: Detecting tunnel configuration..."

CFG_DIR="$HOME/.cloudflared"
if [ ! -f "$CFG_DIR/config.yml" ]; then
  echo "❌ Config file not found: $CFG_DIR/config.yml"
  exit 3
fi

if [ ! -f "$CFG_DIR/$TUNNEL_NAME.json" ]; then
  echo "❌ Credentials file not found: $CFG_DIR/$TUNNEL_NAME.json"
  exit 4
fi

TUNNEL_ID=$(jq -r '.TunnelID' "$CFG_DIR/$TUNNEL_NAME.json" 2>/dev/null)
if [ -z "$TUNNEL_ID" ] || [ "$TUNNEL_ID" == "null" ]; then
  echo "❌ Could not determine tunnel ID"
  exit 5
fi

TUNNEL_TARGET="$TUNNEL_ID.cfargotunnel.com"
echo "   ✅ Tunnel ID:     $TUNNEL_ID"
echo "   ✅ Tunnel Target: $TUNNEL_TARGET"
echo "   ✅ Configuration: $CFG_DIR/config.yml"
echo ""

# === STEP 4: Check Tunnel Status via API ===
echo "🔌 Step 4: Checking tunnel status via Cloudflare API..."

TUNNEL_API_RESPONSE=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

TUNNEL_STATUS=$(echo "$TUNNEL_API_RESPONSE" | jq -r ".result.status")
TUNNEL_CREATED=$(echo "$TUNNEL_API_RESPONSE" | jq -r ".result.created_at")
TUNNEL_CONNECTIONS=$(echo "$TUNNEL_API_RESPONSE" | jq -r ".result.connections | length")

echo "   📊 Status:      $TUNNEL_STATUS"
echo "   📅 Created:     $TUNNEL_CREATED"
echo "   🔗 Connections: $TUNNEL_CONNECTIONS"

if [ "$TUNNEL_STATUS" == "active" ]; then
  echo "   ✅ Tunnel is ACTIVE and connected to Cloudflare edge"
  TUNNEL_RUNNING=true
elif [ "$TUNNEL_STATUS" == "down" ]; then
  echo "   ⚠️  Tunnel exists but is not currently running"
  echo "   💡 Start it with: cd /workspace && ./run-cloudflare-tunnel.sh"
  TUNNEL_RUNNING=false
else
  echo "   ℹ️  Tunnel status: $TUNNEL_STATUS"
  TUNNEL_RUNNING=false
fi
echo ""

# === STEP 5: Fetch Current Cloudflare DNS Record ===
echo "🔍 Step 5: Fetching DNS configuration for $SUBDOMAIN.$DOMAIN..."

CF_ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r ".result[0].id")

DOMAIN_FOUND=true
if [ -z "$CF_ZONE_ID" ] || [ "$CF_ZONE_ID" == "null" ]; then
  echo "   ⚠️  Domain $DOMAIN not found in Cloudflare account"
  echo "   📍 This is expected if you haven't added the domain yet"
  DOMAIN_FOUND=false
  CF_ZONE_ID=""
  CURRENT_TARGET="(domain not in Cloudflare)"
  RECORD_ID=""
  DNS_FIXED=false
else
  echo "   ✅ Zone ID: $CF_ZONE_ID"
  
  DNS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?name=$SUBDOMAIN.$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

  RECORD_ID=$(echo "$DNS_RESPONSE" | jq -r ".result[0].id")
  CURRENT_TARGET=$(echo "$DNS_RESPONSE" | jq -r ".result[0].content")
  RECORD_TYPE=$(echo "$DNS_RESPONSE" | jq -r ".result[0].type")

  if [ "$CURRENT_TARGET" == "null" ] || [ -z "$CURRENT_TARGET" ]; then
    echo "   ⚠️  No existing DNS record found"
    CURRENT_TARGET="(none)"
    RECORD_ID=""
  else
    echo "   📍 Current Target: $CURRENT_TARGET"
    echo "   📋 Record Type:    $RECORD_TYPE"
    echo "   🆔 Record ID:      $RECORD_ID"
  fi
fi
echo ""

# === STEP 6: Fix DNS Record if Needed ===
if [ "$DOMAIN_FOUND" == "true" ]; then
  echo "🛠  Step 6: Checking and fixing DNS record..."

  if [ "$CURRENT_TARGET" != "$TUNNEL_TARGET" ]; then
    echo "   ⚠️  DNS mismatch detected!"
    echo "   Current:  $CURRENT_TARGET"
    echo "   Expected: $TUNNEL_TARGET"
    echo ""
    echo "   🔧 Applying auto-fix..."
    
    # Delete old record if it exists
    if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
      echo "   🗑️  Deleting old record..."
      curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" >/dev/null
    fi
    
    # Create new CNAME record
    echo "   ➕ Creating new CNAME record..."
    CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"CNAME\",\"name\":\"$SUBDOMAIN\",\"content\":\"$TUNNEL_TARGET\",\"ttl\":1,\"proxied\":true}")
    
    SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r ".success")
    if [ "$SUCCESS" == "true" ]; then
      echo "   ✅ DNS record updated successfully!"
      DNS_FIXED=true
    else
      echo "   ❌ Failed to update DNS record"
      echo "$CREATE_RESPONSE" | jq .
      DNS_FIXED=false
    fi
  else
    echo "   ✅ DNS record already correct - no changes needed"
    DNS_FIXED=false
  fi
  echo ""
else
  echo "🛠  Step 6: DNS auto-fix skipped (domain not in Cloudflare)"
  echo "   📋 Manual action required:"
  echo "   1. Go to: https://dash.cloudflare.com/"
  echo "   2. Add domain: $DOMAIN"
  echo "   3. Create CNAME record:"
  echo "      Name:   $SUBDOMAIN"
  echo "      Target: $TUNNEL_TARGET"
  echo "      Proxy:  ON"
  echo ""
  DNS_FIXED=false
fi

# === STEP 7: Verify Public Reachability ===
echo "🌍 Step 7: Verifying public access to https://$SUBDOMAIN.$DOMAIN..."

if [ "$DNS_FIXED" == "true" ]; then
  echo "   ⏳ Waiting 15 seconds for DNS propagation..."
  sleep 15
else
  echo "   ⏳ Waiting 5 seconds..."
  sleep 5
fi

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "https://$SUBDOMAIN.$DOMAIN" 2>/dev/null || echo "000")

echo "   📊 HTTP Status Code: $STATUS_CODE"

if [[ "$STATUS_CODE" =~ ^2[0-9]{2}$ ]]; then
  VERIFICATION_STATUS="success"
  echo "   ✅ Public access verified successfully!"
elif [ "$STATUS_CODE" == "502" ] || [ "$STATUS_CODE" == "503" ]; then
  VERIFICATION_STATUS="tunnel_up_app_down"
  echo "   ⚠️  Tunnel is working but backend app may not be running"
  echo "   💡 Make sure your app is running on port 3001"
elif [ "$STATUS_CODE" == "000" ]; then
  VERIFICATION_STATUS="dns_not_configured"
  echo "   ⚠️  Cannot reach domain - DNS not configured or still propagating"
elif [ "$STATUS_CODE" == "521" ] || [ "$STATUS_CODE" == "522" ] || [ "$STATUS_CODE" == "523" ]; then
  VERIFICATION_STATUS="tunnel_down"
  echo "   ⚠️  Cloudflare cannot reach tunnel - tunnel may not be running"
else
  VERIFICATION_STATUS="error"
  echo "   ⚠️  Unexpected HTTP status: $STATUS_CODE"
fi
echo ""

# === STEP 8: Generate Verification Report ===
echo "📝 Step 8: Generating verification report..."

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$LOGDIR/dns_verification.json" <<JSON
{
  "timestamp": "$TIMESTAMP",
  "mission": "Cloudflare DNS Auto-Fix & Tunnel Verification",
  "domain": "$SUBDOMAIN.$DOMAIN",
  "tunnel_id": "$TUNNEL_ID",
  "tunnel_name": "$TUNNEL_NAME",
  "tunnel_target": "$TUNNEL_TARGET",
  "tunnel_status": "$TUNNEL_STATUS",
  "tunnel_running": $TUNNEL_RUNNING,
  "domain_in_cloudflare": $DOMAIN_FOUND,
  "previous_dns_target": "$CURRENT_TARGET",
  "dns_auto_fixed": $DNS_FIXED,
  "http_status_code": "$STATUS_CODE",
  "verification_status": "$VERIFICATION_STATUS",
  "url": "https://$SUBDOMAIN.$DOMAIN",
  "local_service": "http://localhost:3001"
}
JSON

cat > "$LOGDIR/dns_verification_human_readable.txt" <<REPORT
════════════════════════════════════════════════════════════════════
  CLOUDFLARE TUNNEL VERIFICATION REPORT
  Generated: $TIMESTAMP
════════════════════════════════════════════════════════════════════

TUNNEL CONFIGURATION:
  Name:          $TUNNEL_NAME
  ID:            $TUNNEL_ID
  Target:        $TUNNEL_TARGET
  Status:        $TUNNEL_STATUS
  Running:       $TUNNEL_RUNNING

DNS CONFIGURATION:
  Domain:        $SUBDOMAIN.$DOMAIN
  In Cloudflare: $DOMAIN_FOUND
  Previous:      $CURRENT_TARGET
  Auto-Fixed:    $DNS_FIXED

VERIFICATION:
  HTTP Status:   $STATUS_CODE
  Result:        $VERIFICATION_STATUS
  Public URL:    https://$SUBDOMAIN.$DOMAIN
  Local Service: http://localhost:3001

════════════════════════════════════════════════════════════════════
REPORT

echo "   ✅ JSON report:  $LOGDIR/dns_verification.json"
echo "   ✅ Text report:  $LOGDIR/dns_verification_human_readable.txt"
echo ""

# === STEP 9: Smart Notifier (if enabled) ===
if [ -f /opt/nursery-runtime/watchdog.sh ]; then
  echo "🔔 Step 9: Triggering smart notifier..."
  bash /opt/nursery-runtime/watchdog.sh || true
  echo ""
fi

# === FINAL REPORT ===
echo "════════════════════════════════════════════════════════════════════"
echo "✅ AUTONOMOUS VERIFICATION COMPLETE"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 SUMMARY:"
echo "   Domain:           $SUBDOMAIN.$DOMAIN"
echo "   Tunnel ID:        $TUNNEL_ID"
echo "   Tunnel Status:    $TUNNEL_STATUS"
echo "   DNS in CF:        $DOMAIN_FOUND"
echo "   DNS Fixed:        $DNS_FIXED"
echo "   HTTP Status:      $STATUS_CODE"
echo "   Verification:     $VERIFICATION_STATUS"
echo ""
echo "📂 Reports saved to: $LOGDIR/"
echo "🌍 Target URL:       https://$SUBDOMAIN.$DOMAIN"
echo ""

if [ "$VERIFICATION_STATUS" == "success" ]; then
  echo "✅✅✅ PERFECT! Everything is working correctly!"
  exit 0
elif [ "$VERIFICATION_STATUS" == "tunnel_up_app_down" ]; then
  echo "⚠️  Tunnel is working but your app needs to start on port 3001"
  echo "   Check: curl http://localhost:3001"
  exit 10
elif [ "$VERIFICATION_STATUS" == "dns_not_configured" ]; then
  echo "⚠️  Domain not in Cloudflare or DNS not configured"
  echo "   Action: Add domain to https://dash.cloudflare.com/"
  exit 11
elif [ "$TUNNEL_STATUS" == "down" ] || [ "$VERIFICATION_STATUS" == "tunnel_down" ]; then
  echo "⚠️  Tunnel is not running. Start it with:"
  echo "   cd /workspace && ./run-cloudflare-tunnel.sh"
  exit 12
else
  echo "⚠️  Some issues detected. Check logs for details."
  exit 13
fi

echo "════════════════════════════════════════════════════════════════════"
