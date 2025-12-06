#!/bin/bash

echo "🏗️ إعداد قاعدة بيانات D1 للإنتاج"
echo "================================="

# إنشاء قاعدة بيانات الإنتاج
echo "📊 إنشاء قاعدة بيانات الإنتاج..."
wrangler d1 create nursery-db-production

echo ""
echo "📋 نسخ database_id من الإخراج أعلاه وضعه في wrangler.toml"
echo ""

# تطبيق migrations
echo "🔄 تطبيق migrations..."
wrangler d1 migrations apply nursery-db-production --remote

echo "✅ تم إعداد قاعدة البيانات بنجاح!"