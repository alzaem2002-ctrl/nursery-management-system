#!/bin/bash

echo "🧪 اختبار النشر المحلي - Local Deployment Test"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
run_test() {
    echo -e "${BLUE}🔍 $1${NC}"
    if $2; then
        echo -e "${GREEN}✅ PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Initialize test results
TESTS_PASSED=0
TESTS_TOTAL=0

echo ""
echo "📋 تشغيل اختبارات ما قبل النشر..."

# Test 1: Node.js version
((TESTS_TOTAL++))
if run_test "فحص إصدار Node.js" "node --version | grep -E 'v(16|18|20)'"; then
    ((TESTS_PASSED++))
fi

# Test 2: Dependencies installation
((TESTS_TOTAL++))
if run_test "فحص تثبيت المتطلبات" "npm list --depth=0"; then
    ((TESTS_PASSED++))
fi

# Test 3: TypeScript compilation
((TESTS_TOTAL++))
if run_test "فحص TypeScript" "npx tsc --noEmit --skipLibCheck"; then
    ((TESTS_PASSED++))
fi

# Test 4: Build process
((TESTS_TOTAL++))
if run_test "فحص عملية البناء" "npm run build"; then
    ((TESTS_PASSED++))
fi

# Test 5: Check dist directory
((TESTS_TOTAL++))
if run_test "فحص ملفات الإخراج" "[ -f dist/_worker.js ]"; then
    ((TESTS_PASSED++))
fi

# Test 6: Check bundle size
((TESTS_TOTAL++))
if run_test "فحص حجم الحزمة" "test $(du -k dist/_worker.js | cut -f1) -lt 100"; then
    ((TESTS_PASSED++))
fi

# Test 7: Security audit
((TESTS_TOTAL++))
if run_test "فحص الأمان" "npm audit --audit-level=high"; then
    ((TESTS_PASSED++))
fi

# Test 8: Check required files
((TESTS_TOTAL++))
check_files() {
    [ -f wrangler.toml ] && [ -f seed.sql ]
}
if run_test "فحص الملفات المطلوبة" check_files; then
    ((TESTS_PASSED++))
fi

echo ""
echo "📊 نتائج الاختبار:"
echo "=================="
echo -e "✅ اختبارات ناجحة: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ اختبارات فاشلة: ${RED}$((TESTS_TOTAL - TESTS_PASSED))${NC}"
echo -e "📈 المعدل: ${BLUE}$((TESTS_PASSED * 100 / TESTS_TOTAL))%${NC}"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo ""
    echo -e "${GREEN}🎉 جميع الاختبارات نجحت! النظام جاهز للنشر${NC}"
    echo ""
    echo "📋 الخطوات التالية:"
    echo "1. تعيين CLOUDFLARE_API_TOKEN"
    echo "2. تشغيل: ./deploy-production.sh"
    echo "أو"
    echo "3. رفع على GitHub للنشر التلقائي"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️ هناك مشاكل تحتاج إصلاح قبل النشر${NC}"
    echo ""
    echo "🔧 الإصلاحات المقترحة:"
    
    if ! npm list --depth=0 > /dev/null 2>&1; then
        echo "- تشغيل: npm install"
    fi
    
    if ! npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
        echo "- إصلاح أخطاء TypeScript"
    fi
    
    if ! npm run build > /dev/null 2>&1; then
        echo "- إصلاح مشاكل البناء"
    fi
    
    if ! npm audit --audit-level=high > /dev/null 2>&1; then
        echo "- تشغيل: npm audit fix"
    fi
    
    exit 1
fi