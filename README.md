# نظام إدارة الحضانة - دار الحنونة

نظام متكامل ذكي لإدارة الحضانات بتقنيات حديثة مع أمان ومراقبة متقدمة.

## 🌟 المميزات

- **إدارة شاملة**: متابعة الأطفال، الموظفين، والأنشطة
- **لوحة تحكم متقدمة**: مراقبة في الوقت الفعلي
- **نظام أمان متقدم**: مصادقة JWT وتشفير البيانات
- **تقارير تفصيلية**: تقارير شاملة عن الأداء
- **واجهة عربية**: دعم كامل للغة العربية
- **تطبيق PWA**: يعمل كتطبيق على الهاتف

## 📋 المتطلبات

- Node.js 18 أو أحدث
- قاعدة بيانات PostgreSQL (Neon)
- npm أو pnpm

## ⚙️ التثبيت المحلي

```bash
# تثبيت الحزم
npm install

# بناء CSS
npm run build:css

# تشغيل في وضع التطوير
npm run dev

# تشغيل في وضع الإنتاج
npm start
```

## 🔧 متغيرات البيئة

قم بإنشاء ملف `.env` في جذر المشروع:

```env
DATABASE_URL=postgresql://user:password@host/database
NODE_ENV=production
PORT=5000
JWT_SECRET=your-jwt-secret-key
```

## 🌐 النشر على الخدمات المجانية

### 1. Render.com (موصى به) ⭐

**الخطوات:**

1. قم بزيارة [Render.com](https://render.com) وسجل دخول
2. انقر على **New +** ثم اختر **Web Service**
3. اربط حسابك بـ GitHub واختر المستودع
4. استخدم الإعدادات التالية:
   - **Name**: nursery-management-system
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build:css`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. أضف قاعدة بيانات PostgreSQL:
   - انقر على **New +** ثم **PostgreSQL**
   - اختر **Free Plan**
   - انسخ **Internal Database URL**
6. أضف متغيرات البيئة:
   - `DATABASE_URL`: الصق رابط قاعدة البيانات
   - `NODE_ENV`: production
   - `PORT`: 5000
   - `JWT_SECRET`: أي نص عشوائي طويل
7. انقر على **Create Web Service**

**رابط التطبيق**: سيكون على شكل `https://nursery-management-system.onrender.com`

### 2. Railway.app

**الخطوات:**

1. قم بزيارة [Railway.app](https://railway.app)
2. سجل دخول باستخدام GitHub
3. انقر على **New Project** ثم **Deploy from GitHub repo**
4. اختر المستودع
5. أضف PostgreSQL:
   - انقر على **+ New**
   - اختر **Database** ثم **PostgreSQL**
6. اربط قاعدة البيانات بالمشروع
7. أضف متغيرات البيئة في **Variables**:
   - `NODE_ENV`: production
   - `PORT`: 5000
   - `JWT_SECRET`: أي نص عشوائي
   - `DATABASE_URL`: سيتم إضافته تلقائياً
8. في **Settings**:
   - **Build Command**: `npm install && npm run build:css`
   - **Start Command**: `npm start`

**رابط التطبيق**: سيتم توليده تلقائياً

### 3. Cyclic.sh

**الخطوات:**

1. قم بزيارة [Cyclic.sh](https://cyclic.sh)
2. سجل دخول باستخدام GitHub
3. انقر على **Deploy**
4. اختر المستودع
5. أضف متغيرات البيئة
6. سيتم النشر تلقائياً

### 4. Fly.io

**الخطوات:**

```bash
# تثبيت Fly CLI
curl -L https://fly.io/install.sh | sh

# تسجيل الدخول
flyctl auth login

# إنشاء التطبيق
flyctl launch

# نشر التطبيق
flyctl deploy
```

## 🗄️ قاعدة البيانات المجانية

### Neon (موصى به) ⭐

1. قم بزيارة [Neon.tech](https://neon.tech)
2. أنشئ حساب جديد
3. أنشئ مشروع جديد
4. انسخ **Connection String**
5. استخدمه في `DATABASE_URL`

### Supabase

1. قم بزيارة [Supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى **Settings** > **Database**
4. انسخ **Connection String**

## 📦 البنية

```
.
├── server/              # كود الخادم
│   ├── routes/         # مسارات API
│   ├── middleware/     # Middleware
│   └── db.js           # إعداد قاعدة البيانات
├── public/             # الملفات الثابتة
│   ├── index.html      # الصفحة الرئيسية
│   └── static/         # CSS و JavaScript
├── shared/             # الكود المشترك
└── server.js           # نقطة الدخول
```

## 🔒 الأمان

- تشفير كلمات المرور باستخدام bcryptjs
- مصادقة JWT
- حماية من XSS و CSRF
- Helmet.js للأمان
- التحقق من المدخلات

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm test

# اختبار الأمان
npm run test:security

# اختبار الأداء
npm run test:performance
```

## 📱 الوصول

بعد النشر، يمكنك الوصول إلى:

- **الصفحة الرئيسية**: `/`
- **تسجيل الدخول**: `/login`
- **لوحة التحكم**: `/dashboard`
- **API**: `/api`
- **فحص الصحة**: `/health`

**بيانات الدخول الافتراضية:**
- المستخدم: `admin`
- كلمة المرور: `admin123`

## 🆘 المساعدة

إذا واجهت أي مشكلة:

1. تأكد من تثبيت جميع الحزم: `npm install`
2. تأكد من إعداد قاعدة البيانات بشكل صحيح
3. تحقق من متغيرات البيئة
4. راجع السجلات: `npm run dev`

## 📝 الترخيص

MIT License

---

**تم التطوير بواسطة**: فريق دار الحنونة  
**الإصدار**: 2.0.0
