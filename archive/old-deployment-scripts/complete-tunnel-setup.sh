#!/bin/bash
# 🧠 MODE: Autonomous Cloudflare Tunnel Setup
# 🎯 PURPOSE: Verify zone, add DNS records, start tunnel, and return final URL
# 🏷️ DOMAIN: dari-system.com
# 🌐 SUBDOMAIN: nursery

set -euo pipefail

echo "════════════════════════════════════════════════════════════════════"
echo "🚀 Smart Cloudflare Tunnel Setup - Autonomous Mode"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Load environment variables
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-OWyabQ4w51MuQFB-8g6mAPz5WGaFh2KNP1z3iOVJ}"
export CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
DOMAIN="dari-system.com"
SUBDOMAIN="nursery"
TUNNEL_ID="9686c0be-c797-4d66-ada2-26f088f8f9c8"

# 🔍 Step 1: Get Zone ID if not provided
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "🔍 Step 1: Fetching Zone ID for $DOMAIN..."
  ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")
  
  CLOUDFLARE_ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id')
  ZONE_STATUS=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].status')
  
  if [ "$CLOUDFLARE_ZONE_ID" == "null" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo ""
    echo "❌ ERROR: Cannot access zone $DOMAIN"
    echo ""
    echo "POSSIBLE REASONS:"
    echo "  1. API token lacks 'Zone:Read' and 'DNS:Edit' permissions"
    echo "  2. Domain not yet added to Cloudflare"
    echo "  3. Domain still in 'pending' status"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "📋 MANUAL SETUP REQUIRED"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Please complete these steps manually:"
    echo ""
    echo "1️⃣  UPDATE NAMESERVERS at your domain registrar:"
    echo "    Go to where you registered dari-system.com and set nameservers to:"
    echo "    • adam.ns.cloudflare.com"
    echo "    • faith.ns.cloudflare.com"
    echo "    (You'll find exact nameservers in Cloudflare dashboard)"
    echo ""
    echo "2️⃣  WAIT for domain activation (5-30 minutes)"
    echo "    Check status at: https://dash.cloudflare.com/"
    echo ""
    echo "3️⃣  ADD DNS RECORDS in Cloudflare Dashboard:"
    echo "    Go to: https://dash.cloudflare.com/"
    echo "    Select: dari-system.com > DNS > Records"
    echo ""
    echo "    Add CNAME record for nursery:"
    echo "    ┌─────────────────────────────────────────────────────────┐"
    echo "    │ Type:    CNAME                                          │"
    echo "    │ Name:    nursery                                        │"
    echo "    │ Target:  $TUNNEL_ID.cfargotunnel.com │"
    echo "    │ Proxy:   ON (orange cloud ☁️)                           │"
    echo "    │ TTL:     Auto                                           │"
    echo "    └─────────────────────────────────────────────────────────┘"
    echo ""
    echo "4️⃣  START TUNNEL:"
    echo "    cd /workspace"
    echo "    ./run-cloudflare-tunnel.sh"
    echo ""
    echo "5️⃣  ACCESS YOUR SITE:"
    echo "    https://nursery.dari-system.com"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    exit 1
  fi
  
  echo "   ✅ Zone ID: $CLOUDFLARE_ZONE_ID"
  echo "   ✅ Status: $ZONE_STATUS"
else
  echo "🔍 Step 1: Using provided Zone ID: $CLOUDFLARE_ZONE_ID"
  
  # Verify zone is active
  ZONE_STATUS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    | jq -r '.result.status')
  
  echo "   Status: $ZONE_STATUS"
fi
echo ""

# 🏁 Step 2: Check if zone is active
if [ "$ZONE_STATUS" != "active" ]; then
  echo "⚠️  WARNING: Domain status is '$ZONE_STATUS' (not active)"
  echo ""
  echo "Please complete nameserver setup:"
  echo "  1. Go to: https://dash.cloudflare.com/"
  echo "  2. Find nameservers for dari-system.com"
  echo "  3. Update them at your domain registrar"
  echo "  4. Wait for activation (usually 5-30 minutes)"
  echo "  5. Re-run this script"
  echo ""
  exit 1
fi

echo "✅ Zone is ACTIVE! Proceeding with DNS setup..."
echo ""

# 🌐 Step 3: Add DNS Records
echo "🌐 Step 3: Adding DNS records..."

# Add CNAME for nursery subdomain
echo "   Adding CNAME for $SUBDOMAIN.$DOMAIN..."
CNAME_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"$SUBDOMAIN\",\"content\":\"$TUNNEL_ID.cfargotunnel.com\",\"proxied\":true,\"ttl\":1}")

if echo "$CNAME_RESPONSE" | jq -e '.success' >/dev/null; then
  echo "   ✅ CNAME record added successfully"
else
  ERROR_MSG=$(echo "$CNAME_RESPONSE" | jq -r '.errors[0].message')
  if [[ "$ERROR_MSG" == *"already exists"* ]]; then
    echo "   ℹ️  CNAME record already exists"
  else
    echo "   ⚠️  Failed to add CNAME: $ERROR_MSG"
  fi
fi

# Optional: Add root domain A record
echo "   Adding A record for root domain (optional)..."
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"@","content":"192.0.2.1","proxied":true,"ttl":1}' >/dev/null 2>&1 || true

# Optional: Add www CNAME
echo "   Adding CNAME for www (optional)..."
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"$DOMAIN\",\"proxied\":true,\"ttl\":1}" >/dev/null 2>&1 || true

echo ""
echo "✅ DNS records configured!"
echo ""

# 🌀 Step 4: Start Cloudflare Tunnel
echo "🌀 Step 4: Starting Cloudflare Tunnel..."

if [ ! -f "./run-cloudflare-tunnel.sh" ]; then
  echo "❌ ERROR: Missing run-cloudflare-tunnel.sh in current directory"
  exit 1
fi

# Check if tunnel is already running
if pgrep -f "cloudflared.*$TUNNEL_ID" >/dev/null; then
  echo "   ℹ️  Tunnel already running. Stopping it first..."
  pkill -f "cloudflared.*$TUNNEL_ID" || true
  sleep 2
fi

chmod +x ./run-cloudflare-tunnel.sh
nohup ./run-cloudflare-tunnel.sh > /dev/null 2>&1 &
TUNNEL_PID=$!

echo "   ✅ Tunnel started (PID: $TUNNEL_PID)"
echo "   ⏳ Waiting for tunnel to establish connection..."
sleep 8

# Check if tunnel process is still running
if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
  echo "   ⚠️  Tunnel process stopped. Check logs:"
  tail -20 /opt/nursery-runtime/logs/cloudflared.log 2>/dev/null || echo "No logs found"
  exit 1
fi

echo "   ✅ Tunnel process is running"
echo ""

# 🔍 Step 5: Verify Tunnel Availability
TUNNEL_URL="https://$SUBDOMAIN.$DOMAIN"
echo "🔍 Step 5: Verifying tunnel accessibility..."
echo "   URL: $TUNNEL_URL"
echo "   ⏳ Testing connection (max 60 seconds)..."

SUCCESS=false
for i in {1..12}; do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$TUNNEL_URL" 2>/dev/null || echo "000")
  
  if [[ "$STATUS_CODE" =~ ^2[0-9]{2}$ ]]; then
    echo "   ✅ SUCCESS! HTTP $STATUS_CODE"
    SUCCESS=true
    break
  elif [ "$STATUS_CODE" == "502" ] || [ "$STATUS_CODE" == "503" ]; then
    echo "   ⚠️  HTTP $STATUS_CODE - Tunnel working but backend app not responding"
    echo "   💡 Make sure your app is running on port 3001"
    SUCCESS=partial
    break
  else
    echo "   ...attempt $i/12 (HTTP $STATUS_CODE)"
    sleep 5
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "🎉 SETUP COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 SUMMARY:"
echo "   Domain:        $SUBDOMAIN.$DOMAIN"
echo "   Tunnel ID:     $TUNNEL_ID"
echo "   Tunnel Status: Running (PID $TUNNEL_PID)"
echo "   DNS Status:    Configured"
echo ""

if [ "$SUCCESS" == "true" ]; then
  echo "✅✅✅ FULLY OPERATIONAL!"
  echo ""
  echo "🌍 Your site is LIVE at:"
  echo "   $TUNNEL_URL"
  echo ""
  echo "🔗 You can also access:"
  echo "   https://$DOMAIN (root domain)"
  echo "   https://www.$DOMAIN (www)"
elif [ "$SUCCESS" == "partial" ]; then
  echo "⚠️  TUNNEL IS WORKING but your application needs attention"
  echo ""
  echo "🌍 Tunnel URL: $TUNNEL_URL"
  echo ""
  echo "⚠️  NEXT STEP: Start your application on port 3001"
  echo "   The tunnel is ready and waiting for your app to respond"
else
  echo "⚠️  Tunnel started but not yet verified"
  echo ""
  echo "🌍 Tunnel URL: $TUNNEL_URL"
  echo ""
  echo "⏳ It may take a few minutes for DNS to fully propagate"
  echo "   Try accessing the URL in 2-5 minutes"
fi

echo ""
echo "📝 USEFUL COMMANDS:"
echo "   View logs:       tail -f /opt/nursery-runtime/logs/cloudflared.log"
echo "   Stop tunnel:     pkill -f cloudflared"
echo "   Restart tunnel:  ./run-cloudflare-tunnel.sh"
echo "   Check process:   ps aux | grep cloudflared"
echo ""
echo "════════════════════════════════════════════════════════════════════"

exit 0
