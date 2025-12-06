// نظام التخزين المحلي المتقدم لنظام إدارة الحضانة
// Advanced Local Storage System for Nursery Management

class OfflineStorageManager {
  constructor() {
    this.dbName = 'NurseryManagementDB';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  // تهيئة قاعدة البيانات المحلية
  async init() {
    try {
      await this.initIndexedDB();
      this.setupOnlineOfflineHandlers();
      await this.loadOfflineData();
      console.log('💾 نظام التخزين المحلي جاهز');
    } catch (error) {
      console.error('خطأ في تهيئة التخزين المحلي:', error);
    }
  }

  // إعداد IndexedDB
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // إنشاء مخازن البيانات المختلفة
        if (!db.objectStoreNames.contains('children')) {
          const childrenStore = db.createObjectStore('children', { keyPath: 'id' });
          childrenStore.createIndex('name', 'name', { unique: false });
          childrenStore.createIndex('classId', 'classId', { unique: false });
        }

        if (!db.objectStoreNames.contains('employees')) {
          const employeesStore = db.createObjectStore('employees', { keyPath: 'id' });
          employeesStore.createIndex('name', 'name', { unique: false });
          employeesStore.createIndex('position', 'position', { unique: false });
        }

        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('childId', 'childId', { unique: false });
          attendanceStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionsStore = db.createObjectStore('offline_actions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // حفظ البيانات في التخزين المحلي
  async saveData(storeName, data) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      if (Array.isArray(data)) {
        for (const item of data) {
          await store.put(item);
        }
      } else {
        await store.put(data);
      }
      
      return true;
    } catch (error) {
      console.error(`خطأ في حفظ ${storeName}:`, error);
      return false;
    }
  }

  // استرجاع البيانات من التخزين المحلي
  async getData(storeName, key = null) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (key) {
        return await store.get(key);
      } else {
        return await store.getAll();
      }
    } catch (error) {
      console.error(`خطأ في استرجاع ${storeName}:`, error);
      return null;
    }
  }

  // حفظ الإجراءات للمزامنة لاحقاً
  async saveOfflineAction(action) {
    const offlineAction = {
      ...action,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    await this.saveData('offline_actions', offlineAction);
    this.updateOfflineIndicator();
  }

  // مزامنة البيانات عند العودة للإنترنت
  async syncOfflineActions() {
    if (!this.isOnline) return;
    
    const actions = await this.getData('offline_actions');
    const unsynced = actions.filter(action => !action.synced);
    
    for (const action of unsynced) {
      try {
        await this.executeAction(action);
        
        // تحديث حالة المزامنة
        action.synced = true;
        await this.saveData('offline_actions', action);
        
      } catch (error) {
        console.error('فشل في مزامنة الإجراء:', error);
      }
    }
    
    this.updateOfflineIndicator();
  }

  // تنفيذ الإجراء على الخادم
  async executeAction(action) {
    const response = await fetch(action.endpoint, {
      method: action.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('nursery-token')}`
      },
      body: JSON.stringify(action.data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // إعداد مستمعي الأحداث للاتصال/عدم الاتصال
  setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOfflineIndicator();
      this.syncOfflineActions();
      console.log('🌐 عاد الاتصال بالإنترنت - بدء المزامنة');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOfflineIndicator();
      console.log('📴 انقطع الاتصال بالإنترنت - التشغيل في وضع عدم الاتصال');
    });
  }

  // تحديث مؤشر حالة الاتصال
  updateOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(indicator);
    }
    
    if (!this.isOnline) {
      indicator.textContent = '📴 وضع عدم الاتصال - البيانات محفوظة محلياً';
      indicator.style.backgroundColor = '#f59e0b';
      indicator.style.color = 'white';
      indicator.style.display = 'block';
    } else {
      const hasUnsynced = localStorage.getItem('nursery-offline-actions');
      if (hasUnsynced) {
        indicator.textContent = '🔄 جاري المزامنة...';
        indicator.style.backgroundColor = '#3b82f6';
        indicator.style.color = 'white';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 3000);
      } else {
        indicator.style.display = 'none';
      }
    }
  }

  // حفظ البيانات في localStorage كنسخة احتياطية
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`nursery-${key}`, JSON.stringify({
        data: data,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }));
      return true;
    } catch (error) {
      console.error('خطأ في حفظ البيانات محلياً:', error);
      return false;
    }
  }

  // استرجاع البيانات من localStorage
  getFromLocalStorage(key) {
    try {
      const stored = localStorage.getItem(`nursery-${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('خطأ في استرجاع البيانات محلياً:', error);
      return null;
    }
  }

  // تحميل البيانات المحفوظة محلياً
  async loadOfflineData() {
    const stores = ['children', 'employees', 'attendance'];
    
    for (const store of stores) {
      const localData = this.getFromLocalStorage(store);
      if (localData && localData.length > 0) {
        await this.saveData(store, localData);
        console.log(`✅ تم تحميل ${localData.length} عنصر من ${store}`);
      }
    }
  }

  // مسح البيانات المحلية
  async clearOfflineData() {
    if (!this.db) return;
    
    const stores = ['children', 'employees', 'attendance', 'offline_actions'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
    
    // مسح localStorage أيضاً
    const keys = Object.keys(localStorage).filter(key => key.startsWith('nursery-'));
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log('🗑️ تم مسح جميع البيانات المحلية');
  }

  // احصائيات التخزين المحلي
  async getStorageStats() {
    if (!this.db) return null;
    
    const stats = {};
    const stores = ['children', 'employees', 'attendance', 'offline_actions'];
    
    for (const storeName of stores) {
      const data = await this.getData(storeName);
      stats[storeName] = data ? data.length : 0;
    }
    
    // حجم localStorage
    let localStorageSize = 0;
    for (let key in localStorage) {
      if (key.startsWith('nursery-')) {
        localStorageSize += localStorage[key].length;
      }
    }
    
    return {
      ...stats,
      localStorageSize: `${(localStorageSize / 1024).toFixed(2)} KB`,
      isOnline: this.isOnline,
      dbVersion: this.dbVersion
    };
  }
}

// تهيئة نظام التخزين المحلي
window.offlineStorage = new OfflineStorageManager();

// دوال مساعدة للاستخدام العام
window.saveOffline = (type, data) => window.offlineStorage.saveData(type, data);
window.loadOffline = (type) => window.offlineStorage.getData(type);
window.syncData = () => window.offlineStorage.syncOfflineActions();

console.log('💾 نظام التخزين المحلي المتقدم جاهز للاستخدام');