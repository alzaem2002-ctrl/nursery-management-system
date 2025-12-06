#!/bin/bash

# 🔑 سكريبت إعداد Cloudflare API للنشر
# Setup Cloudflare Authentication for Deployment

echo "🔑 إعداد توثيق Cloudflare لنظام إدارة الحضانة"
echo "============================================"
echo ""

# فحص حالة التوثيق الحالية
echo "🔍 فحص حالة التوثيق الحالية..."
if npx wrangler whoami 2>/dev/null | grep -q "You are not authenticated"; then
    echo "❌ لم يتم تسجيل الدخول إلى Cloudflare"
    echo ""
    
    echo "📋 لديك خيارين للتوثيق:"
    echo ""
    echo "الخيار 1: تسجيل الدخول التفاعلي (الأسهل)"
    echo "-------------------------------------------"
    echo "تشغيل الأمر التالي وسيفتح المتصفح:"
    echo "npx wrangler auth login"
    echo ""
    
    echo "الخيار 2: استخدام API Token يدوياً"
    echo "----------------------------------"
    echo "1. اذهب إلى: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. انقر 'Create Token'"
    echo "3. اختر 'Cloudflare Pages:Edit' template"
    echo "4. انسخ Token واستخدمه كالتالي:"
    echo "   export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo ""
    
    echo "الخيار 3: النشر البديل عبر GitHub Actions"
    echo "----------------------------------------"
    echo "إذا واجهت صعوبات، يمكن النشر عبر GitHub:"
    echo "1. ادفع الكود إلى GitHub"
    echo "2. أضف CLOUDFLARE_API_TOKEN في GitHub Secrets"  
    echo "3. سيتم النشر تلقائياً"
    echo ""
    
else
    echo "✅ تم تسجيل الدخول بنجاح!"
    npx wrangler whoami
    echo ""
    echo "🚀 يمكنك الآن النشر باستخدام:"
    echo "npm run deploy:prod"
    echo "أو"
    echo "./deploy-production.sh"
fi

echo ""
echo "📚 للمزيد من التفاصيل راجع:"
echo "- CLOUDFLARE_API_SETUP_GUIDE.md"
echo "- DEPLOYMENT_GUIDE.md"
echo ""

# فحص إعدادات wrangler
echo "🔧 فحص إعدادات wrangler..."
if [ -f "wrangler.toml" ]; then
    echo "✅ ملف wrangler.toml موجود"
    
    # عرض إعدادات المشروع
    echo ""
    echo "📄 إعدادات المشروع الحالية:"
    echo "-----------------------------"
    grep -E "^(name|compatibility_date)" wrangler.toml || echo "لم يتم العثور على إعدادات أساسية"
    echo ""
    
else
    echo "❌ ملف wrangler.toml غير موجود!"
fi

# فحص حالة البناء
echo "🏗️ فحص حالة البناء..."
if [ -d "dist" ]; then
    echo "✅ مجلد dist موجود"
    echo "📊 ملفات البناء:"
    ls -la dist/ | head -10
else
    echo "❌ مجلد dist غير موجود. تشغيل البناء..."
    npm run build
fi

echo ""
echo "🎯 الخطوات التالية:"
echo "==================="
echo "1. إما تسجيل الدخول: npx wrangler auth login"
echo "2. أو إعداد API Token: export CLOUDFLARE_API_TOKEN='your-token'"  
echo "3. ثم النشر: npm run deploy:prod"
echo ""
echo "🆘 للمساعدة راجع: CLOUDFLARE_API_SETUP_GUIDE.md"