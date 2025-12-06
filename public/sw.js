// Service Worker for Nursery Management System PWA
// تطبيق الخدمة للعمل بدون اتصال - نظام إدارة الحضانة

const CACHE_NAME = 'nursery-management-v2.0';
const urlsToCache = [
  '/',
  '/static/app-enhanced.js',
  '/static/styles.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('تثبيت Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('فتح التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('خطأ في تخزين الملفات:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('تفعيل Service Worker الجديد');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف التخزين المؤقت القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('مزامنة البيانات في الخلفية...');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get offline data from IndexedDB and sync with server
    console.log('بدء مزامنة البيانات المحفوظة محلياً');
    // Implementation would sync offline stored data
  } catch (error) {
    console.error('خطأ في المزامنة:', error);
  }
}

// Push notifications support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من نظام الحضانة',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification('نظام إدارة الحضانة', options)
  );
});