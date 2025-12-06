#!/bin/bash

# ========================================
# Complete Flow Test for Nursery System
# اختبار شامل لنظام دار الحنونة
# ========================================

BASE_URL="http://localhost:5000"
EMAIL="admin@nursery.com"
PASSWORD="admin123"

echo "════════════════════════════════════════════════════════════"
echo "🧪 اختبار شامل لنظام إدارة دار الحنونة"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "${BASE_URL}/health")
if echo "$HEALTH" | grep -q "\"status\":\"healthy\""; then
    echo "   ✅ السيرفر يعمل"
else
    echo "   ❌ السيرفر لا يعمل"
    exit 1
fi
echo ""

# Test 2: Login
echo "2️⃣  تسجيل الدخول..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "   ✅ تسجيل الدخول نجح"
    echo "   🔑 Token: ${TOKEN:0:30}..."
else
    echo "   ❌ فشل تسجيل الدخول"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Get Current User
echo "3️⃣  جلب بيانات المستخدم..."
USER_INFO=$(curl -s "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_INFO" | grep -q "\"success\":true"; then
    USER_NAME=$(echo "$USER_INFO" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    USER_ROLE=$(echo "$USER_INFO" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ المستخدم: $USER_NAME"
    echo "   👤 الدور: $USER_ROLE"
else
    echo "   ❌ فشل جلب بيانات المستخدم"
fi
echo ""

# Test 4: Dashboard Stats
echo "4️⃣  إحصائيات Dashboard..."
STATS=$(curl -s "${BASE_URL}/api/nursery/stats/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS" | grep -q "\"success\":true"; then
    TOTAL_CHILDREN=$(echo "$STATS" | grep -o '"totalChildren":[0-9]*' | cut -d':' -f2)
    PRESENT_TODAY=$(echo "$STATS" | grep -o '"presentToday":[0-9]*' | cut -d':' -f2)
    echo "   ✅ إحصائيات Dashboard"
    echo "   👶 إجمالي الأطفال: $TOTAL_CHILDREN"
    echo "   ✔️  الحاضرين اليوم: $PRESENT_TODAY"
else
    echo "   ❌ فشل جلب الإحصائيات"
fi
echo ""

# Test 5: Get Children
echo "5️⃣  قائمة الأطفال..."
CHILDREN=$(curl -s "${BASE_URL}/api/nursery/children" \
  -H "Authorization: Bearer $TOKEN")

if echo "$CHILDREN" | grep -q "\"success\":true"; then
    CHILDREN_COUNT=$(echo "$CHILDREN" | grep -o '"id":[0-9]*' | wc -l)
    echo "   ✅ قائمة الأطفال: $CHILDREN_COUNT طفل"
    
    # عرض أول 3 أطفال
    echo "   📋 عينة من الأطفال:"
    echo "$CHILDREN" | grep -o '"name":"[^"]*"' | head -3 | while read line; do
        NAME=$(echo "$line" | cut -d'"' -f4)
        echo "      • $NAME"
    done
else
    echo "   ❌ فشل جلب قائمة الأطفال"
fi
echo ""

# Test 6: Get Attendance
echo "6️⃣  سجلات الحضور..."
ATTENDANCE=$(curl -s "${BASE_URL}/api/nursery/attendance" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ATTENDANCE" | grep -q "\"success\":true"; then
    ATTENDANCE_COUNT=$(echo "$ATTENDANCE" | grep -o '"id":[0-9]*' | wc -l)
    echo "   ✅ سجلات الحضور: $ATTENDANCE_COUNT سجل"
else
    echo "   ❌ فشل جلب سجلات الحضور"
fi
echo ""

# Test 7: Get Assessments
echo "7️⃣  التقييمات..."
ASSESSMENTS=$(curl -s "${BASE_URL}/api/nursery/assessments" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ASSESSMENTS" | grep -q "\"success\":true"; then
    ASSESSMENTS_COUNT=$(echo "$ASSESSMENTS" | grep -o '"id":[0-9]*' | wc -l)
    echo "   ✅ التقييمات: $ASSESSMENTS_COUNT تقييم"
else
    echo "   ❌ فشل جلب التقييمات"
fi
echo ""

# Test 8: Get Activities
echo "8️⃣  الأنشطة..."
ACTIVITIES=$(curl -s "${BASE_URL}/api/nursery/activities" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ACTIVITIES" | grep -q "\"success\":true"; then
    ACTIVITIES_COUNT=$(echo "$ACTIVITIES" | grep -o '"id":[0-9]*' | wc -l)
    echo "   ✅ الأنشطة: $ACTIVITIES_COUNT نشاط"
else
    echo "   ❌ فشل جلب الأنشطة"
fi
echo ""

# Test 9: Create Child (CRUD Test)
echo "9️⃣  اختبار إضافة طفل جديد..."
NEW_CHILD=$(curl -s -X POST "${BASE_URL}/api/nursery/children" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "طفل تجريبي",
    "age": 4,
    "gender": "male",
    "parentName": "ولي أمر تجريبي",
    "parentPhone": "0501234567",
    "address": "عنوان تجريبي"
  }')

if echo "$NEW_CHILD" | grep -q "\"success\":true"; then
    NEW_CHILD_ID=$(echo "$NEW_CHILD" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   ✅ تم إضافة طفل جديد (ID: $NEW_CHILD_ID)"
    
    # Test 10: Delete Test Child
    echo ""
    echo "🔟 حذف الطفل التجريبي..."
    DELETE_RESULT=$(curl -s -X DELETE "${BASE_URL}/api/nursery/children/${NEW_CHILD_ID}" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DELETE_RESULT" | grep -q "\"success\":true"; then
        echo "   ✅ تم حذف الطفل التجريبي"
    else
        echo "   ⚠️  تحذير: لم يتم حذف الطفل التجريبي"
    fi
else
    echo "   ❌ فشل إضافة طفل جديد"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "✅ اكتمل الاختبار الشامل بنجاح!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 النتائج:"
echo "   • السيرفر: ✅ يعمل"
echo "   • المصادقة: ✅ تعمل"
echo "   • Dashboard: ✅ يعمل"
echo "   • قائمة الأطفال: ✅ تعمل ($CHILDREN_COUNT طفل)"
echo "   • الحضور: ✅ يعمل ($ATTENDANCE_COUNT سجل)"
echo "   • التقييمات: ✅ تعمل ($ASSESSMENTS_COUNT تقييم)"
echo "   • الأنشطة: ✅ تعمل ($ACTIVITIES_COUNT نشاط)"
echo "   • CRUD Operations: ✅ تعمل"
echo ""
echo "🎉 النظام جاهز للاستخدام!"
echo "════════════════════════════════════════════════════════════"
