# 🚀 إعداد النشر التلقائي عبر GitHub Actions
## Automated Deployment Setup with GitHub Actions

## 📋 نظرة عامة

تم إعداد النظام للنشر التلقائي على Cloudflare Pages باستخدام GitHub Actions. هذا يعني أن النظام سيتم نشره تلقائياً عند أي تحديث على الكود.

## 🔑 الخطوات المطلوبة

### 1️⃣ **رفع الكود على GitHub**

```bash
# إنشاء repository جديد على GitHub
# ثم رفع الكود:
git remote add origin https://github.com/YOUR_USERNAME/nursery-management-system.git
git branch -M main
git push -u origin main
```

### 2️⃣ **إعداد Secrets في GitHub**

اذهب إلى GitHub Repository → Settings → Secrets and Variables → Actions

أضف المتغيرات التالية:

#### **CLOUDFLARE_API_TOKEN**
- القيمة: API Token من Cloudflare Dashboard
- المصدر: https://dash.cloudflare.com/profile/api-tokens
- الصلاحيات المطلوبة:
  - Account:Cloudflare Pages:Edit
  - Account:D1:Edit
  - Zone:Zone Settings:Edit
  - Zone:Zone:Read

#### **CLOUDFLARE_ACCOUNT_ID**
- القيمة: Account ID من Cloudflare Dashboard
- المصدر: https://dash.cloudflare.com (الجانب الأيمن)

### 3️⃣ **تفعيل GitHub Actions**

1. اذهب إلى GitHub Repository → Actions
2. إذا لم يكن مفعل، انقر "I understand my workflows, go ahead and enable them"
3. سيتم تشغيل النشر تلقائياً عند أي push للـ main branch

## 🔄 كيفية عمل النشر التلقائي

### عند Push للـ main branch:
1. ✅ **Checkout Code** - تحميل أحدث كود
2. ✅ **Setup Node.js** - إعداد بيئة Node.js 18
3. ✅ **Install Dependencies** - تثبيت المتطلبات
4. ✅ **Build Project** - بناء المشروع للإنتاج
5. ✅ **Setup D1 Database** - إعداد قاعدة البيانات
6. ✅ **Apply Migrations** - تطبيق تحديثات البيانات
7. ✅ **Seed Database** - إضافة البيانات التجريبية
8. ✅ **Deploy to Pages** - النشر على Cloudflare Pages
9. ✅ **Health Check** - فحص صحة النشر

## 📊 مراقبة النشر

### GitHub Actions Dashboard
- **URL:** `https://github.com/YOUR_USERNAME/nursery-management-system/actions`
- **معلومات:** سجل النشر، الأخطاء، وقت النشر

### Cloudflare Pages Dashboard  
- **URL:** `https://dash.cloudflare.com/pages`
- **معلومات:** إحصائيات الموقع، الأداء، السجلات

## 🌐 الوصول للنظام المنشور

### الروابط الرئيسية
- **النظام:** `https://nursery-management-system.pages.dev`
- **بيانات الدخول:** admin@nursery.com / admin123

### روابط الإدارة
- **Cloudflare Pages:** `https://dash.cloudflare.com/pages`
- **D1 Database:** `https://dash.cloudflare.com/d1`
- **GitHub Actions:** `https://github.com/YOUR_USERNAME/nursery-management-system/actions`

## 🔧 إدارة النشر

### نشر تحديث جديد
```bash
# إجراء تعديلات على الكود
git add .
git commit -m "تحديث: وصف التحديث"
git push origin main

# سيتم النشر تلقائياً!
```

### إيقاف النشر التلقائي مؤقتاً
```bash
# إنشاء branch جديد للتطوير
git checkout -b development
git push origin development

# العمل على development branch لن يؤدي لنشر تلقائي
```

### نشر من branch آخر
```yaml
# تعديل .github/workflows/deploy.yml
on:
  push:
    branches: [ main, development ]  # إضافة branch آخر
```

## ⚠️ نصائح مهمة

### 🔒 الأمان
- لا تشارك API Tokens في الكود المفتوح
- استخدم GitHub Secrets دائماً
- راجع صلاحيات Tokens بانتظام

### 🚀 الأداء
- النشر يستغرق 2-5 دقائق عادة
- في حالة الفشل، تحقق من GitHub Actions logs
- قاعدة البيانات تحتاج إعداد مرة واحدة فقط

### 📈 التطوير
- استخدم branches للمزايا الجديدة
- اختبر التحديثات محلياً قبل النشر
- استخدم Pull Requests للمراجعة

## 🆘 حل المشاكل الشائعة

### خطأ في API Token
```
Error: Authentication failed
```
**الحل:** تحقق من CLOUDFLARE_API_TOKEN في GitHub Secrets

### خطأ في قاعدة البيانات  
```
Error: D1 database not found
```
**الحل:** تحقق من CLOUDFLARE_ACCOUNT_ID وصحة database name

### خطأ في البناء
```
Error: Build failed
```
**الحل:** تحقق من الكود محلياً بـ `npm run build`

## 📞 الدعم

للحصول على المساعدة:
1. **GitHub Actions Logs** - تفاصيل الأخطاء
2. **Cloudflare Support** - مشاكل النشر
3. **GitHub Community** - مسائل عامة

---

**تاريخ الإنشاء:** 27 سبتمبر 2025  
**الحالة:** جاهز للتطبيق ✅