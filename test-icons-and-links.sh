#!/usr/bin/env bash
# ===============================================================
# 🧩 QA Test Script for Nursery Management System (Render Deployment)
# هدف السكربت: اختبار الصفحات والأيقونات للتطبيق المنشور
# ===============================================================

BASE_URL="https://nursery-management-system-dari-alhanonah.onrender.com"

echo "════════════════════════════════════════════════════════════════════"
echo "🔍 Starting QA test for: $BASE_URL"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# تعريف الصفحات المتوقع وجودها في لوحة التحكم
declare -A ROUTES=(
  [Login]="/"
  [Dashboard]="/dashboard"
  [Students]="/students"
  [Teachers]="/teachers"
  [Attendance]="/attendance"
  [Behavior]="/behavior"
  [Reports]="/reports"
  [Settings]="/settings"
)

# اختبار الاتصال الأساسي
echo "🌍 Testing site availability..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$STATUS" != "200" ]; then
  echo "❌ الموقع لا يستجيب (Status: $STATUS)"
  exit 1
else
  echo "✅ الموقع متاح ويعمل (HTTP $STATUS)"
fi

echo ""
echo "📋 فحص الصفحات الرئيسية..."
echo "────────────────────────────────────────────────────────────────────"

# فحص كل صفحة والتأكد من رمز HTTP
TOTAL=0
PASSED=0

for NAME in "${!ROUTES[@]}"; do
  URL="${BASE_URL}${ROUTES[$NAME]}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  TOTAL=$((TOTAL + 1))
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ [$NAME] تعمل بنجاح (HTTP $STATUS) → $URL"
    PASSED=$((PASSED + 1))
  elif [ "$STATUS" = "302" ] || [ "$STATUS" = "301" ]; then
    echo "⚠️  [$NAME] يُعاد توجيهها (HTTP $STATUS)"
  else
    echo "❌ [$NAME] خطأ في التحميل (HTTP $STATUS)"
  fi
done

echo ""
echo "🎨 فحص وجود مكتبة Font Awesome للأيقونات..."
echo "────────────────────────────────────────────────────────────────────"

HTML=$(curl -s "$BASE_URL")
CHECK=$(echo "$HTML" | grep -i "font-awesome")

if [ -n "$CHECK" ]; then
  echo "✅ مكتبة Font Awesome محمّلة بنجاح والأيقونات يفترض أن تعمل."
  
  # استخراج الإصدار
  VERSION=$(echo "$HTML" | grep -o "font-awesome/[0-9.]*" | head -1)
  if [ -n "$VERSION" ]; then
    echo "   📦 Version: $VERSION"
  fi
  
  # التحقق من وجود أصناف الأيقونات
  if echo "$HTML" | grep -q "fa-solid\|fa-regular\|fa-brands"; then
    echo "   ✅ أصناف FontAwesome موجودة في HTML"
  fi
else
  echo "❌ لم يتم العثور على Font Awesome – الأيقونات لن تظهر."
fi

echo ""
echo "📱 فحص PWA (Progressive Web App)..."
echo "────────────────────────────────────────────────────────────────────"

# فحص manifest.json
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/manifest.json")
if [ "$MANIFEST_STATUS" = "200" ]; then
  echo "✅ Manifest.json متاح (HTTP $MANIFEST_STATUS)"
else
  echo "⚠️  Manifest.json غير متاح (HTTP $MANIFEST_STATUS)"
fi

# فحص favicon
FAVICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/favicon.svg")
if [ "$FAVICON_STATUS" = "200" ]; then
  echo "✅ Favicon.svg متاح (HTTP $FAVICON_STATUS)"
else
  FAVICON_ICO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/favicon.ico")
  if [ "$FAVICON_ICO_STATUS" = "200" ]; then
    echo "✅ Favicon.ico متاح (HTTP $FAVICON_ICO_STATUS)"
  else
    echo "⚠️  Favicon غير متاح"
  fi
fi

echo ""
echo "📊 ملخص النتائج:"
echo "────────────────────────────────────────────────────────────────────"
echo "إجمالي الصفحات المختبرة: $TOTAL"
echo "الصفحات الناجحة: $PASSED"
echo "الصفحات الفاشلة: $((TOTAL - PASSED))"

if [ $TOTAL -gt 0 ]; then
  PASS_RATE=$((PASSED * 100 / TOTAL))
  echo "نسبة النجاح: ${PASS_RATE}%"
  
  echo ""
  if [ "$PASS_RATE" -ge 90 ]; then
    echo "✅ ممتاز! جميع الصفحات تعمل بشكل صحيح"
  elif [ "$PASS_RATE" -ge 70 ]; then
    echo "✅ جيد! معظم الصفحات تعمل"
  elif [ "$PASS_RATE" -ge 50 ]; then
    echo "⚠️  يحتاج انتباه - بعض الصفحات لا تعمل"
  else
    echo "❌ تحتاج إصلاح - معظم الصفحات لا تعمل"
  fi
fi

echo ""
echo "🧠 التوصيات:"
echo "────────────────────────────────────────────────────────────────────"

if [ -z "$CHECK" ]; then
  echo "• أضف رابط CDN لـ Font Awesome داخل <head>:"
  echo "  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'>"
  echo ""
fi

if [ $PASSED -lt $TOTAL ]; then
  echo "• بعض الصفحات تُرجع 404 - قد تكون:"
  echo "  1. غير منشأة بعد (طبيعي في مرحلة التطوير)"
  echo "  2. تتطلب تسجيل دخول"
  echo "  3. لها مسارات مختلفة"
  echo ""
fi

echo "════════════════════════════════════════════════════════════════════"
echo "🔚 اختبار الأيقونات والروابط انتهى بنجاح."
echo "════════════════════════════════════════════════════════════════════"
