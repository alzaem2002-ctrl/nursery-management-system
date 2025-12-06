// Enhanced JavaScript for Nursery Management System
// Combined React/Hono system with AI Studio design

class NurseryManagementSystem {
  constructor() {
    this.currentUser = null;
    this.currentTab = 'dashboard';
    this.data = {
      children: [],
      employees: [],
      attendance: []
    };
    this.init();
  }

  async init() {
    console.log('نظام إدارة الحضانة - بدء التشغيل...');
    
    // Hide loading screen
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    }, 1000);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data if logged in
    const savedUser = localStorage.getItem('nursery-user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.showApp();
      await this.loadDashboardData();
    } else {
      this.showLogin();
    }
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    // Navigation links
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        e.preventDefault();
        const tab = e.target.getAttribute('data-tab');
        if (tab) {
          this.showTab(tab);
        }
      }
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value || document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
      this.showToast('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success && result.user) {
        this.currentUser = result.user;
        localStorage.setItem('nursery-user', JSON.stringify(result.user));
        localStorage.setItem('nursery-token', result.token);
        
        this.showToast('تم تسجيل الدخول بنجاح!', 'success');
        this.showApp();
        await this.loadDashboardData();
      } else {
        this.showToast('بيانات الدخول غير صحيحة. جرب: admin@nursery.com / admin123', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('خطأ في الاتصال بالخادم', 'error');
    }
  }

  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('nursery-user');
    localStorage.removeItem('nursery-token');
    this.showLogin();
    this.showToast('تم تسجيل الخروج بنجاح', 'info');
  }

  showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appScreen) appScreen.style.display = 'none';
  }

  showApp() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) {
      appScreen.style.display = 'block';
      appScreen.classList.remove('hidden');
    }
    
    this.showTab('dashboard');
  }

  showTab(tabName) {
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
      tab.classList.remove('active');
      tab.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.classList.add('active');
      selectedTab.style.display = 'block';
    }

    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      }
    });

    this.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
      case 'children':
        this.loadChildrenTab();
        break;
      case 'employees':
        this.loadEmployeesTab();
        break;
      case 'attendance':
        this.loadAttendanceTab();
        break;
      case 'settings':
        this.loadSettingsTab();
        break;
    }
  }

  async loadDashboardData() {
    try {
      const response = await fetch('/api/dashboard/stats');
      const result = await response.json();
      
      if (result.success && result.data) {
        this.updateDashboardStats(result.data);
        
        // Also load recent data
        await Promise.all([
          this.loadData('children'),
          this.loadData('employees'),
          this.loadData('attendance')
        ]);
        
        this.updateRecentChildrenTable();
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
    }
  }

  updateDashboardStats(stats) {
    // Update stat numbers
    const elements = {
      'children-count': stats.totalChildren,
      'employees-count': stats.totalEmployees,
      'attendance-count': stats.presentToday
    };

    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }
  }

  async loadData(type) {
    try {
      // محاولة تحميل البيانات من الخادم أولاً
      const response = await fetch(`/api/${type}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        this.data[type] = result.data;
        
        // حفظ البيانات محلياً كنسخة احتياطية
        if (window.offlineStorage) {
          window.offlineStorage.save(type, result.data);
        }
        
        return result.data;
      }
    } catch (error) {
      console.error(`خطأ في تحميل ${type} من الخادم:`, error);
      
      // في حالة الفشل، حاول تحميل البيانات المحفوظة محلياً
      if (window.offlineStorage) {
        const offlineData = window.offlineStorage.load(type);
        
        if (offlineData && offlineData.length > 0) {
          this.data[type] = offlineData;
          this.showToast(`تم تحميل ${type} من التخزين المحلي`, 'warning');
          return offlineData;
        }
      }
      
      return [];
    }
  }

  updateRecentChildrenTable() {
    const tableBody = document.querySelector('#recent-children-table tbody');
    if (!tableBody || !this.data.children) return;

    tableBody.innerHTML = '';
    
    // Show last 5 children
    const recentChildren = this.data.children.slice(-5);
    
    recentChildren.forEach(child => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${child.name}</td>
        <td>${child.age} سنوات</td>
        <td>${child.parent}</td>
        <td>${child.phone}</td>
        <td>${child.enrollmentDate}</td>
        <td>
          <button class="btn btn-sm" onclick="app.editChild(${child.id})">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteChild(${child.id})">حذف</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  async loadChildrenTab() {
    const childrenTab = document.getElementById('children');
    if (!childrenTab) return;

    const children = await this.loadData('children') || [];
    
    childrenTab.innerHTML = `
      <section class="content-section">
        <div class="content-header">
          <h2>إدارة الأطفال</h2>
          <button class="btn" onclick="app.showAddChildForm()">إضافة طفل جديد</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>العمر</th>
              <th>ولي الأمر</th>
              <th>الهاتف</th>
              <th>تاريخ التسجيل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${children.map(child => `
              <tr>
                <td>${child.name}</td>
                <td>${child.age} سنوات</td>
                <td>${child.parent}</td>
                <td>${child.phone}</td>
                <td>${child.enrollmentDate}</td>
                <td>
                  <button class="btn btn-sm" onclick="app.editChild(${child.id})">تعديل</button>
                  <button class="btn btn-sm btn-danger" onclick="app.deleteChild(${child.id})">حذف</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  async loadEmployeesTab() {
    const employeesTab = document.getElementById('employees');
    if (!employeesTab) return;

    const employees = await this.loadData('employees') || [];
    
    employeesTab.innerHTML = `
      <section class="content-section">
        <div class="content-header">
          <h2>إدارة الموظفين</h2>
          <button class="btn" onclick="app.showAddEmployeeForm()">إضافة موظف جديد</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المنصب</th>
              <th>الراتب</th>
              <th>الهاتف</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(employee => `
              <tr>
                <td>${employee.name}</td>
                <td>${employee.position}</td>
                <td>${employee.salary} ريال</td>
                <td>${employee.phone}</td>
                <td>
                  <button class="btn btn-sm" onclick="app.editEmployee(${employee.id})">تعديل</button>
                  <button class="btn btn-sm btn-danger" onclick="app.deleteEmployee(${employee.id})">حذف</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  async loadAttendanceTab() {
    const attendanceTab = document.getElementById('attendance');
    if (!attendanceTab) return;

    const attendance = await this.loadData('attendance') || [];
    const children = this.data.children || [];
    
    attendanceTab.innerHTML = `
      <section class="content-section">
        <div class="content-header">
          <h2>نظام الحضور والغياب</h2>
          <button class="btn" onclick="app.showAttendanceForm()">تسجيل حضور</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم الطفل</th>
              <th>التاريخ</th>
              <th>وقت الدخول</th>
              <th>وقت الخروج</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${attendance.map(record => {
              const child = children.find(c => c.id === record.childId);
              return `
                <tr>
                  <td>${child ? child.name : 'غير معروف'}</td>
                  <td>${record.date}</td>
                  <td>${record.checkinTime || '-'}</td>
                  <td>${record.checkoutTime || '-'}</td>
                  <td>
                    <span class="status ${record.status}">
                      ${record.status === 'present' ? 'حاضر' : 'غائب'}
                    </span>
                  </td>
                  <td>
                    ${!record.checkoutTime ? 
                      `<button class="btn btn-sm" onclick="app.checkOut(${record.id})">تسجيل خروج</button>` : 
                      '-'
                    }
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    };

    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg slide-in`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // وظائف التحكم في البيانات مع التخزين المحلي
  async editChild(id) { 
    // محاولة التعديل على الخادم أولاً
    try {
      // هذا مجرد مثال - في التطبيق الحقيقي ستكون هناك نافذة تعديل
      this.showToast(`جاري تعديل بيانات الطفل ${id}...`, 'info');
    } catch (error) {
      // في حالة فشل الاتصال، حفظ العملية للمزامنة لاحقاً
      if (window.offlineStorage) {
        await window.offlineStorage.saveOfflineAction({
          type: 'edit_child',
          endpoint: `/api/children/${id}`,
          method: 'PUT',
          data: { id }
        });
        this.showToast('تم حفظ التعديل محلياً - سيتم المزامنة عند عودة الاتصال', 'warning');
      }
    }
  }
  
  async deleteChild(id) { 
    if (confirm('هل أنت متأكد من حذف هذا الطفل؟')) {
      try {
        // محاولة الحذف على الخادم
        this.showToast(`جاري حذف الطفل ${id}...`, 'warning');
      } catch (error) {
        // حفظ العملية للمزامنة لاحقاً
        if (window.offlineStorage) {
          await window.offlineStorage.saveOfflineAction({
            type: 'delete_child',
            endpoint: `/api/children/${id}`,
            method: 'DELETE',
            data: { id }
          });
          this.showToast('تم حفظ عملية الحذف محلياً', 'warning');
        }
      }
    }
  }
  
  async checkOut(id) { 
    try {
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId: id })
      });
      
      if (response.ok) {
        this.showToast('تم تسجيل الخروج بنجاح', 'success');
        await this.loadAttendanceTab(); // إعادة تحميل البيانات
      }
    } catch (error) {
      // حفظ العملية محلياً
      if (window.offlineStorage) {
        await window.offlineStorage.saveOfflineAction({
          type: 'checkout',
          endpoint: '/api/attendance/checkout',
          method: 'POST',
          data: { attendanceId: id, timestamp: new Date().toISOString() }
        });
        this.showToast('تم حفظ تسجيل الخروج محلياً', 'warning');
      }
    }
  }
  
  editEmployee(id) { this.showToast(`تعديل موظف ${id} - قيد التطوير`, 'info'); }
  deleteEmployee(id) { this.showToast(`حذف موظف ${id} - قيد التطوير`, 'warning'); }
  showAddChildForm() { this.showToast('نموذج إضافة طفل - قيد التطوير', 'info'); }
  showAddEmployeeForm() { this.showToast('نموذج إضافة موظف - قيد التطوير', 'info'); }
  showAttendanceForm() { this.showToast('نموذج تسجيل الحضور - قيد التطوير', 'info'); }

  // Settings Management Functions
  async loadSettingsTab() {
    console.log('تحميل صفحة الإعدادات...');
    
    try {
      const response = await this.apiCall('/api/settings', { method: 'GET' });
      if (response?.success) {
        this.renderSettingsPage(response.data);
      } else {
        throw new Error(response?.message || 'فشل في تحميل الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      this.showToast('خطأ في تحميل الإعدادات', 'error');
      this.renderSettingsPage({});
    }
  }

  renderSettingsPage(settingsData) {
    const settingsContainer = document.getElementById('settings');
    if (!settingsContainer) return;

    const categoryTitles = {
      'basic_info': 'معلومات الحضانة الأساسية',
      'working_hours': 'ساعات العمل',
      'capacity': 'الطاقة الاستيعابية',
      'financial': 'الإعدادات المالية',
      'security': 'إعدادات الأمان',
      'notifications': 'الإشعارات',
      'academic': 'الإعدادات الأكاديمية'
    };

    let settingsHTML = `
      <div class="settings-container">
        <div class="content-header">
          <h2><i class="fas fa-cogs"></i> إعدادات النظام</h2>
          <div class="settings-actions">
            <button class="btn btn-primary" onclick="app.saveSettings()">
              <i class="fas fa-save"></i> حفظ جميع الإعدادات
            </button>
            <button class="btn btn-secondary" onclick="app.resetAllSettings()">
              <i class="fas fa-undo"></i> استعادة الإعدادات الافتراضية
            </button>
          </div>
        </div>
        
        <div class="settings-tabs">
    `;

    // Create tabs for each category
    Object.keys(settingsData).forEach((category, index) => {
      const isActive = index === 0 ? 'active' : '';
      settingsHTML += `
        <button class="settings-tab ${isActive}" 
                onclick="app.switchSettingsTab('${category}')" 
                id="tab-${category}">
          ${categoryTitles[category] || category}
        </button>
      `;
    });

    settingsHTML += `</div><div class="settings-content">`;

    // Create content for each category
    Object.keys(settingsData).forEach((category, index) => {
      const isActive = index === 0 ? 'active' : '';
      settingsHTML += `
        <div class="settings-tab-content ${isActive}" id="content-${category}">
          <h3>${categoryTitles[category] || category}</h3>
          <form class="settings-form" data-category="${category}">
      `;

      const settings = settingsData[category] || [];
      settings.forEach(setting => {
        settingsHTML += this.renderSettingField(setting);
      });

      settingsHTML += `
          </form>
        </div>
      `;
    });

    settingsHTML += `
        </div>
      </div>
    `;

    settingsContainer.innerHTML = settingsHTML;
  }

  renderSettingField(setting) {
    const { key, value, description, input_type, min_value, max_value, options } = setting;
    
    let inputHTML = '';
    let inputAttrs = '';

    if (input_type === 'number') {
      inputAttrs += min_value !== null ? ` min="${min_value}"` : '';
      inputAttrs += max_value !== null ? ` max="${max_value}"` : '';
      inputHTML = `<input type="number" id="${key}" name="${key}" value="${value}" ${inputAttrs} class="form-input" required>`;
    } else if (input_type === 'time') {
      inputHTML = `<input type="time" id="${key}" name="${key}" value="${value}" class="form-input" required>`;
    } else if (input_type === 'email') {
      inputHTML = `<input type="email" id="${key}" name="${key}" value="${value}" class="form-input" required>`;
    } else if (input_type === 'tel') {
      inputHTML = `<input type="tel" id="${key}" name="${key}" value="${value}" class="form-input" required>`;
    } else if (input_type === 'textarea') {
      inputHTML = `<textarea id="${key}" name="${key}" class="form-input" rows="3" required>${value}</textarea>`;
    } else if (input_type === 'select' && options) {
      const optionsData = JSON.parse(options);
      inputHTML = `<select id="${key}" name="${key}" class="form-input" required>`;
      Object.keys(optionsData).forEach(optKey => {
        const selected = value === optKey ? 'selected' : '';
        inputHTML += `<option value="${optKey}" ${selected}>${optionsData[optKey]}</option>`;
      });
      inputHTML += `</select>`;
    } else {
      inputHTML = `<input type="text" id="${key}" name="${key}" value="${value}" class="form-input" required>`;
    }

    return `
      <div class="form-group">
        <label for="${key}">${description}</label>
        ${inputHTML}
        ${min_value !== null && max_value !== null ? 
          `<small class="form-help">القيم المسموحة: ${min_value} - ${max_value}</small>` : ''}
      </div>
    `;
  }

  switchSettingsTab(category) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.getElementById(`tab-${category}`)?.classList.add('active');
    document.getElementById(`content-${category}`)?.classList.add('active');
  }

  async saveSettings() {
    const settingsForms = document.querySelectorAll('.settings-form');
    const allSettings = [];

    settingsForms.forEach(form => {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        allSettings.push({ key, value });
      });
    });

    try {
      const response = await this.apiCall('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: allSettings })
      });

      if (response?.success) {
        this.showToast('تم حفظ الإعدادات بنجاح', 'success');
        // Reload settings to reflect changes
        await this.loadSettingsTab();
      } else {
        throw new Error(response?.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      this.showToast(`خطأ: ${error.message}`, 'error');
    }
  }

  async resetAllSettings() {
    if (!confirm('هل أنت متأكد من استعادة جميع الإعدادات إلى القيم الافتراضية؟')) {
      return;
    }

    try {
      const response = await this.apiCall('/api/settings/reset', {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (response?.success) {
        this.showToast('تم استعادة الإعدادات الافتراضية بنجاح', 'success');
        await this.loadSettingsTab();
      } else {
        throw new Error(response?.message || 'فشل في استعادة الإعدادات');
      }
    } catch (error) {
      console.error('خطأ في استعادة الإعدادات:', error);
      this.showToast(`خطأ: ${error.message}`, 'error');
    }
  }
  
  // عرض إحصائيات التخزين المحلي
  showStorageStats() {
    if (window.offlineStorage) {
      const stats = window.offlineStorage.getStats();
      let message = `📊 إحصائيات التخزين المحلي:\n\n`;
      message += `📦 عدد العناصر المحفوظة: ${stats.itemCount}\n`;
      message += `💾 حجم البيانات: ${stats.totalSize}\n`;
      message += `🌐 حالة الاتصال: ${stats.isOnline ? 'متصل' : 'غير متصل'}\n\n`;
      
      // عرض البيانات المحفوظة
      const savedChildren = this.offlineStorage?.load('children') || [];
      const savedEmployees = this.offlineStorage?.load('employees') || [];
      const savedAttendance = this.offlineStorage?.load('attendance') || [];
      
      message += `👶 الأطفال المحفوظين: ${savedChildren.length}\n`;
      message += `👨‍💼 الموظفين المحفوظين: ${savedEmployees.length}\n`;
      message += `📅 سجلات الحضور: ${savedAttendance.length}\n`;
      
      alert(message);
    } else {
      alert('نظام التخزين المحلي غير متاح');
    }
  }
}

// نظام التخزين المحلي المبسط
class SimpleOfflineStorage {
  constructor() {
    this.prefix = 'nursery-';
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  save(key, data) {
    try {
      const dataWithTimestamp = {
        data: data,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(dataWithTimestamp));
      return true;
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      return false;
    }
  }

  load(key) {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      return null;
    }
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      console.log('🌐 عاد الاتصال بالإنترنت');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateConnectionStatus();
      console.log('📴 انقطع الاتصال - التشغيل محلياً');
    });
  }

  updateConnectionStatus() {
    let indicator = document.getElementById('connection-status');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'connection-status';
      indicator.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;
        z-index: 10000; transition: all 0.3s ease; display: none;
      `;
      document.body.appendChild(indicator);
    }
    
    if (!this.isOnline) {
      indicator.textContent = '📴 وضع عدم الاتصال - البيانات محفوظة محلياً';
      indicator.style.backgroundColor = '#f59e0b';
      indicator.style.color = 'white';
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  }

  getStats() {
    let totalSize = 0;
    let itemCount = 0;
    
    for (let key in localStorage) {
      if (key.startsWith(this.prefix)) {
        totalSize += localStorage[key].length;
        itemCount++;
      }
    }
    
    return {
      itemCount,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      isOnline: this.isOnline
    };
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('تحميل نظام إدارة الحضانة...');
  
  // تهيئة التخزين المحلي أولاً
  window.offlineStorage = new SimpleOfflineStorage();
  
  // ثم تهيئة التطبيق
  window.app = new NurseryManagementSystem();
});

// Global error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

// Service worker registration (disabled for now)
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js').catch(err => {
//     console.log('Service worker registration failed:', err);
//   });
// }

console.log('ملف JavaScript للتطبيق جاهز ✓');