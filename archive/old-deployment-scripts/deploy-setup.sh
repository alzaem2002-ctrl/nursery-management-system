#!/bin/bash

echo "🚀 إعداد النشر لنظام إدارة الحضانة"
echo "=================================="

# التحقق من wrangler
echo "📝 التحقق من wrangler..."
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler غير مثبت"
    echo "📦 تثبيت wrangler..."
    npm install -g wrangler
fi

# التحقق من تسجيل الدخول
echo "🔐 التحقق من تسجيل الدخول..."
if ! npx wrangler whoami &> /dev/null; then
    echo "⚠️  تحتاج لتسجيل الدخول إلى Cloudflare"
    echo "📋 تشغيل الأمر التالي:"
    echo "   npx wrangler login"
    echo ""
    echo "أو إعداد API Token:"
    echo "   export CLOUDFLARE_API_TOKEN=your_token_here"
else
    echo "✅ تم تسجيل الدخول بنجاح"
fi

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build

# التحقق من إعدادات D1
echo "💾 التحقق من قاعدة البيانات..."
npx wrangler d1 list

echo "✨ انتهى الإعداد!"
echo "📍 لنشر المشروع استخدم:"
echo "   npm run deploy"