#!/bin/bash

# 🚀 نشر نظام إدارة الحضانة على Vercel
# Deploy Nursery Management System to Vercel

echo "🚀 نشر نظام إدارة الحضانة على Vercel"
echo "====================================="
echo ""

# فحص Node.js
echo "🔍 فحص متطلبات النشر..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# فحص npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير متوفر"
    exit 1
fi

# فحص وجود package.json
if [ ! -f "package.json" ]; then
    echo "❌ ملف package.json غير موجود"
    exit 1
fi

echo "✅ البيئة جاهزة"
echo ""

# تثبيت التبعيات إذا لم تكن موجودة
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ فشل في تثبيت التبعيات"
        exit 1
    fi
    echo "✅ تم تثبيت التبعيات"
else
    echo "✅ التبعيات موجودة"
fi

# بناء المشروع
echo ""
echo "🏗️ بناء المشروع للإنتاج..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء المشروع"
    echo ""
    echo "🔧 حلول مقترحة:"
    echo "1. تأكد من عدم وجود أخطاء في الكود"
    echo "2. راجع الأخطاء أعلاه"
    echo "3. جرب: npm run build --verbose"
    exit 1
fi

echo "✅ تم بناء المشروع بنجاح"

# فحص ملفات البناء
if [ ! -d "dist" ]; then
    echo "❌ مجلد dist غير موجود"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ ملف index.html غير موجود في dist"
    exit 1
fi

echo "✅ ملفات البناء جاهزة"
echo ""

# فحص تثبيت Vercel CLI
echo "🔍 فحص Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "📥 تثبيت Vercel CLI..."
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo "❌ فشل في تثبيت Vercel CLI"
        echo "جرب يدوياً: npm install -g vercel"
        exit 1
    fi
    echo "✅ تم تثبيت Vercel CLI"
else
    echo "✅ Vercel CLI جاهز"
fi

# إعداد Vercel configuration
echo ""
echo "⚙️ إعداد تكوين Vercel..."

# إنشاء ملف vercel.json إذا لم يكن موجوداً
if [ ! -f "vercel.json" ]; then
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "nursery-management-system",
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF
    echo "✅ تم إنشاء ملف vercel.json"
else
    echo "✅ ملف vercel.json موجود"
fi

# بدء عملية النشر
echo ""
echo "🚀 بدء النشر على Vercel..."
echo "سيتم فتح المتصفح لتسجيل الدخول إذا لم تكن مسجلاً"
echo ""

# النشر
vercel --prod --yes

DEPLOY_STATUS=$?

echo ""
if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "🎉 تم النشر بنجاح!"
    echo ""
    echo "📋 معلومات النشر:"
    echo "=================="
    echo "🌐 المنصة: Vercel"
    echo "📱 النوع: Progressive Web App"
    echo "🔒 الأمان: HTTPS enabled"
    echo "⚡ الأداء: CDN enabled"
    echo ""
    echo "🔗 رابط التطبيق سيظهر أعلاه"
    echo ""
    echo "📚 ملاحظات:"
    echo "- التطبيق متاح فوراً على الرابط المعروض"
    echo "- بيانات الدخول: admin@nursery.com / admin123" 
    echo "- يدعم العربية بالكامل"
    echo "- متجاوب مع جميع الأجهزة"
    echo ""
    echo "🔄 للتحديث المستقبلي:"
    echo "vercel --prod"
    echo ""
else
    echo "❌ فشل النشر"
    echo ""
    echo "🔧 حلول مقترحة:"
    echo "1. تأكد من اتصال الإنترنت"
    echo "2. سجل الدخول يدوياً: vercel login"
    echo "3. جرب النشر يدوياً: vercel --prod"
    echo "4. راجع الأخطاء أعلاه للتفاصيل"
    echo ""
    echo "📋 بدائل أخرى:"
    echo "- Netlify: راجع ALTERNATIVE_DEPLOYMENT_OPTIONS.md"
    echo "- GitHub Pages: git push origin main"
    echo "- Surge.sh: cd dist && surge ."
    exit 1
fi

echo "🏁 انتهت عملية النشر"