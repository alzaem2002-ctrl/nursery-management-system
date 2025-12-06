# Cloudflare Tunnel Setup - نفق Cloudflare

## ✅ What Was Completed (ما تم إنجازه)

1. ✅ **Cloudflared installed** - تم تثبيت cloudflared
   - Version: 2025.9.1
   - Location: `/usr/local/bin/cloudflared`

2. ✅ **Tunnel Created** - تم إنشاء النفق
   - **Name**: nursery-prod
   - **Tunnel ID**: `9686c0be-c797-4d66-ada2-26f088f8f9c8`
   - **Account ID**: `d23fe4532560dffb51596e070f1c4afa`
   - **Status**: ✅ Successfully tested and connected!

3. ✅ **Configuration Files** - ملفات التكوين
   - Credentials: `~/.cloudflared/nursery-prod.json`
   - Config: `~/.cloudflared/config.yml`

4. ⚠️ **DNS Setup** - إعداد DNS
   - **Status**: Not completed (لم يكتمل)
   - **Reason**: Domain `dari-system.com` not found in this Cloudflare account
   - **Action Required**: Add domain to Cloudflare or use correct domain

## 🚀 How to Run the Tunnel (كيفية تشغيل النفق)

### Option 1: Direct Run (تشغيل مباشر)
```bash
./run-cloudflare-tunnel.sh
```

### Option 2: Background Process (عملية خلفية)
```bash
nohup ./run-cloudflare-tunnel.sh > /dev/null 2>&1 &
```

### Option 3: Manual Run (تشغيل يدوي)
```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run
```

## 🔧 Configuration Details (تفاصيل التكوين)

The tunnel is configured to:
- **Hostname**: nursery.dari-system.com
- **Service**: http://localhost:3001
- **Logs**: /opt/nursery-runtime/logs/

## ⚠️ DNS Setup Required (مطلوب إعداد DNS)

You need to manually add the DNS record in Cloudflare Dashboard:

1. Go to: https://dash.cloudflare.com/
2. Select your domain: **dari-system.com** (or add it if not present)
3. Go to **DNS** > **Records**
4. Add a **CNAME** record:
   - **Type**: CNAME
   - **Name**: nursery
   - **Target**: `9686c0be-c797-4d66-ada2-26f088f8f9c8.cfargotunnel.com`
   - **Proxy status**: Proxied (orange cloud)
   - **TTL**: Auto

## 🔍 Troubleshooting (استكشاف الأخطاء)

### Check tunnel status (فحص حالة النفق)
```bash
cloudflared tunnel info 9686c0be-c797-4d66-ada2-26f088f8f9c8
```

### List all tunnels (عرض جميع الأنفاق)
```bash
cloudflared tunnel list
```

### View logs (عرض السجلات)
```bash
tail -f /opt/nursery-runtime/logs/cloudflared.log
```

### Delete tunnel if needed (حذف النفق إذا لزم الأمر)
```bash
cloudflared tunnel delete nursery-prod
```

## 📝 For Production Servers with systemd (للخوادم الإنتاجية مع systemd)

If you're running on a server with systemd (not a container), you can use:

```bash
sudo systemctl enable cloudflared-nursery.service
sudo systemctl start cloudflared-nursery.service
sudo systemctl status cloudflared-nursery.service
```

The systemd service file is already created at:
`/etc/systemd/system/cloudflared-nursery.service`

## 🔐 Security Notes (ملاحظات الأمان)

- API Token used: `OWyabQ4w51MuQFB-8g6mAPz5WGaFh2KNP1z3iOVJ`
- Credentials stored in: `~/.cloudflared/nursery-prod.json`
- Keep these files secure and do not commit to version control

## 🌍 Your Secure URL (رابطك الآمن)

Once DNS is properly configured:
**https://nursery.dari-system.com**

## 📚 Additional Resources (مصادر إضافية)

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
