#!/bin/bash

set -e  # Exit on any error

echo "🚀 نشر نظام إدارة الحضانة على الإنتاج"
echo "===================================="
echo ""

# التحقق من المتطلبات
echo "🔍 التحقق من المتطلبات..."

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN غير معرف"
    echo "📝 يرجى تعريف المتغير:"
    echo "   export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler غير مثبت"
    echo "📦 تثبيت wrangler..."
    npm install -g wrangler@latest
fi

# التحقق من تسجيل الدخول
echo "🔐 التحقق من المصادقة..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ غير مصادق على Cloudflare"
    echo "🔑 يرجى تسجيل الدخول أولاً:"
    echo "   wrangler login"
    exit 1
fi

echo "✅ تم التحقق بنجاح من جميع المتطلبات"
echo ""

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ تم بناء المشروع بنجاح"
else
    echo "❌ فشل في بناء المشروع"
    exit 1
fi

# إعداد قاعدة البيانات للإنتاج (إذا لم تكن موجودة)
echo ""
echo "📊 فحص قاعدة بيانات الإنتاج..."
if ! wrangler d1 list | grep -q "nursery-db-production"; then
    echo "🏗️ إنشاء قاعدة بيانات الإنتاج..."
    wrangler d1 create nursery-db-production
    
    echo ""
    echo "⚠️ IMPORTANT: يرجى تحديث database_id في wrangler.toml"
    echo "📋 انسخ database_id من الإخراج أعلاه وضعه في:"
    echo "   wrangler.toml -> [env.production] -> database_id"
    echo ""
    read -p "اضغط Enter بعد تحديث database_id..."
    
    # تطبيق migrations
    echo "🔄 تطبيق migrations على الإنتاج..."
    wrangler d1 migrations apply nursery-db-production --remote
    
    # إضافة بيانات تجريبية
    if [ -f "./seed.sql" ]; then
        echo "🌱 إضافة البيانات التجريبية..."
        wrangler d1 execute nursery-db-production --remote --file=./seed.sql
    fi
else
    echo "✅ قاعدة البيانات موجودة"
fi

# النشر على Cloudflare Pages
echo ""
echo "🌐 نشر على Cloudflare Pages..."
wrangler pages deploy dist --project-name nursery-management-system --env production

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 تم النشر بنجاح!"
    echo ""
    echo "📍 روابط مفيدة:"
    echo "   🌐 Dashboard: https://dash.cloudflare.com"
    echo "   📊 Pages: https://dash.cloudflare.com/pages"
    echo "   💾 D1: https://dash.cloudflare.com/d1"
    echo ""
    echo "🔗 رابط النظام سيكون:"
    echo "   https://nursery-management-system.pages.dev"
    echo ""
    echo "👤 بيانات الدخول الافتراضية:"
    echo "   📧 البريد: admin@nursery.com"
    echo "   🔑 كلمة المرور: admin123"
    echo ""
    echo "⚠️ يُنصح بتغيير بيانات الدخول الافتراضية!"
else
    echo "❌ فشل في النشر"
    exit 1
fi