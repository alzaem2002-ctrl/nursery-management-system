// ========================================
// Nursery Management System - Frontend App
// نظام إدارة دار الحنونة - الواجهة الأمامية
// ========================================

// Production Mode: Disable console.log
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.log = function() {};
  console.debug = function() {};
}

// Quick Login Fill Function
function fillLogin(email, password) {
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
  document.getElementById('email').focus();
}

class NurseryApp {
  constructor() {
    this.currentUser = null;
    this.currentView = 'dashboard';
    this.children = [];
    this.stats = null;
    
    this.init();
  }
  
  async init() {
    console.log('🚀 تهيئة نظام إدارة الحضانة...');
    
    // انتظار تحميل API Client
    await this.waitForAPI();
    
    // التحقق من حالة تسجيل الدخول
    await this.checkAuth();
    
    // ربط الأحداث
    this.bindEvents();
    
    // إخفاء شاشة التحميل
    this.hideLoadingScreen();
    
    console.log('✅ النظام جاهز!');
  }
  
  // ==================== Utilities ====================
  
  escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  waitForAPI() {
    return new Promise((resolve) => {
      if (window.API) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (window.API) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('opacity-0');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg slide-in mb-2`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }
  
  showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }
  
  // ==================== Authentication ====================
  
  async checkAuth() {
    try {
      const result = await window.API.getCurrentUser();
      
      if (result.success && result.data) {
        this.currentUser = result.data;
        this.showDashboard();
        await this.loadDashboardData();
      } else {
        this.showLogin();
      }
    } catch (error) {
      console.log('👤 لم يتم تسجيل الدخول');
      this.showLogin();
    }
  }
  
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      this.showLoading(true);
      
      const result = await window.API.login(email, password);
      
      if (result.success) {
        this.currentUser = result.data.user;
        this.showToast('✅ تم تسجيل الدخول بنجاح', 'success');
        this.showDashboard();
        await this.loadDashboardData();
      } else {
        this.showToast('❌ خطأ في البريد الإلكتروني أو كلمة المرور', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('❌ ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async handleLogout() {
    window.API.logout();
    this.currentUser = null;
    this.showLogin();
  }
  
  // ==================== UI Navigation ====================
  
  showLogin() {
    document.getElementById('html-app').classList.remove('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('children-management').classList.add('hidden');
  }
  
  showDashboard() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('children-management').classList.add('hidden');
    document.getElementById('html-app').classList.remove('hidden');
    
    // تحديث اسم المستخدم
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && this.currentUser) {
      userNameEl.textContent = `مرحباً، ${this.currentUser.name}`;
    }
  }
  
  showChildrenManagement() {
    console.log('🔵 showChildrenManagement تم استدعاؤها');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('children-management').classList.remove('hidden');
    this.loadChildrenList();
  }
  
  backToDashboard() {
    document.getElementById('children-management').classList.add('hidden');
    document.getElementById('users-management').classList.add('hidden');
    document.getElementById('attendance-view').classList.add('hidden');
    document.getElementById('assessments-view').classList.add('hidden');
    document.getElementById('activities-view').classList.add('hidden');
    document.getElementById('reports-view').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
  }
  
  // ==================== Dashboard Data ====================
  
  async loadDashboardData() {
    try {
      this.showLoading(true);
      
      // تحميل الإحصائيات
      const statsResult = await window.API.getDashboardStats();
      
      if (statsResult.success && statsResult.data) {
        this.stats = statsResult.data;
        this.updateDashboardStats();
        console.log('✅ تم تحميل بيانات Dashboard بنجاح:', this.stats);
      } else {
        console.warn('⚠️ فشل تحميل الإحصائيات:', statsResult);
        this.showToast('⚠️ خطأ في تحميل الإحصائيات', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      this.showToast('⚠️ خطأ في تحميل البيانات', 'warning');
    } finally {
      this.showLoading(false);
    }
  }
  
  updateDashboardStats() {
    if (!this.stats) {
      console.warn('⚠️ لا توجد بيانات إحصائيات لعرضها');
      return;
    }
    
    // تحديث بطاقات الإحصائيات
    const statCards = {
      'total-children': this.stats.totalChildren || 0,
      'present-today': this.stats.presentToday || 0,
      'total-staff': this.stats.totalStaff || 0,
      'activities-today': this.stats.activitiesToday || 0
    };
    
    Object.keys(statCards).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = statCards[id];
        console.log(`📊 تحديث ${id}: ${statCards[id]}`);
      } else {
        console.warn(`⚠️ عنصر ${id} غير موجود في الصفحة`);
      }
    });
  }
  
  // ==================== Children Management ====================
  
  async loadChildrenList() {
    try {
      this.showLoading(true);
      
      const result = await window.API.getChildren();
      
      if (result.success) {
        this.children = result.data;
        this.renderChildrenTable();
        this.showToast(`✅ تم تحميل ${this.children.length} طفل`, 'success');
      }
      
    } catch (error) {
      console.error('Load children error:', error);
      this.showToast('❌ خطأ في تحميل قائمة الأطفال', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  renderChildrenTable() {
    const tbody = document.getElementById('children-table-body');
    if (!tbody) return;
    
    if (this.children.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">
            <div class="text-lg">📋 لا توجد بيانات</div>
            <div class="text-sm mt-2">قم بإضافة طفل جديد للبدء</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.children.map((child, index) => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4 text-sm text-gray-900">${index + 1}</td>
        <td class="px-6 py-4">
          <div class="flex items-center">
            ${child.photoUrl ? 
              `<img src="${this.escapeHtml(child.photoUrl)}" alt="${this.escapeHtml(child.name)}" class="w-10 h-10 rounded-full ml-3">` :
              `<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                <span class="text-blue-600 font-bold">${this.escapeHtml(child.name.charAt(0))}</span>
              </div>`
            }
            <div>
              <div class="font-medium text-gray-900">${this.escapeHtml(child.name)}</div>
              <div class="text-sm text-gray-500">الرقم: ${child.id}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-900">${child.age} سنوات</td>
        <td class="px-6 py-4 text-sm text-gray-900">${this.escapeHtml(child.parentName || '-')}</td>
        <td class="px-6 py-4 text-sm text-gray-900">${this.escapeHtml(child.parentPhone || '-')}</td>
        <td class="px-6 py-4 text-sm">
          <button onclick="window.nurseryApp.viewChild(${child.id})" 
                  class="text-blue-600 hover:text-blue-800 ml-3">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="window.nurseryApp.editChild(${child.id})" 
                  class="text-green-600 hover:text-green-800 ml-3">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="window.nurseryApp.deleteChild(${child.id})" 
                  class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  showAddChildForm() {
    document.getElementById('child-form-section').classList.remove('hidden');
    document.getElementById('children-list-section').classList.add('hidden');
    document.getElementById('child-form').reset();
    document.getElementById('child-id').value = '';
  }
  
  cancelAddChild() {
    document.getElementById('child-form-section').classList.add('hidden');
    document.getElementById('children-list-section').classList.remove('hidden');
  }
  
  async handleChildSubmit(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('child-name').value,
      age: parseInt(document.getElementById('child-age').value),
      dateOfBirth: '2020-01-01', // سيتم حسابه من العمر
      parentName: document.getElementById('parent-name').value,
      parentPhone: document.getElementById('parent-phone').value,
      parentEmail: document.getElementById('parent-email').value || null,
      address: document.getElementById('address').value || null,
      medicalNotes: document.getElementById('medical-notes').value || null,
      enrollmentDate: new Date().toISOString().split('T')[0]
    };
    
    const childId = document.getElementById('child-id').value;
    
    try {
      this.showLoading(true);
      
      let result;
      if (childId) {
        // تعديل
        result = await window.API.updateChild(childId, formData);
        this.showToast('✅ تم تحديث بيانات الطفل', 'success');
      } else {
        // إضافة جديد
        result = await window.API.createChild(formData);
        this.showToast('✅ تم إضافة الطفل بنجاح', 'success');
      }
      
      if (result.success) {
        this.cancelAddChild();
        await this.loadChildrenList();
      }
      
    } catch (error) {
      console.error('Child submit error:', error);
      this.showToast('❌ ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async deleteChild(childId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطفل؟')) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const result = await window.API.deleteChild(childId);
      
      if (result.success) {
        this.showToast('✅ تم حذف الطفل', 'success');
        await this.loadChildrenList();
      }
      
    } catch (error) {
      console.error('Delete child error:', error);
      this.showToast('❌ ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async editChild(childId) {
    try {
      this.showLoading(true);
      
      const result = await window.API.getChild(childId);
      
      if (result.success) {
        const child = result.data;
        
        // ملء النموذج
        document.getElementById('child-id').value = child.id;
        document.getElementById('child-name').value = child.name;
        document.getElementById('child-age').value = child.age;
        document.getElementById('parent-name').value = child.parentName || '';
        document.getElementById('parent-phone').value = child.parentPhone || '';
        document.getElementById('parent-email').value = child.parentEmail || '';
        document.getElementById('address').value = child.address || '';
        document.getElementById('medical-notes').value = child.medicalNotes || '';
        
        this.showAddChildForm();
      }
      
    } catch (error) {
      console.error('Edit child error:', error);
      this.showToast('❌ ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async viewChild(childId) {
    this.showToast('🔍 جاري تحميل التفاصيل...', 'info');
    // TODO: عرض صفحة تفاصيل الطفل
  }
  
  // ==================== Search & Filter ====================
  
  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
      this.renderChildrenTable();
      return;
    }
    
    const filtered = this.children.filter(child => 
      child.name.toLowerCase().includes(searchTerm) ||
      (child.parentName && child.parentName.toLowerCase().includes(searchTerm))
    );
    
    // عرض النتائج المفلترة
    const tbody = document.getElementById('children-table-body');
    if (!tbody) return;
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">
            <div class="text-lg">🔍 لا توجد نتائج</div>
            <div class="text-sm mt-2">جرب البحث بكلمات أخرى</div>
          </td>
        </tr>
      `;
      return;
    }
    
    // استخدام نفس منطق renderChildrenTable لكن مع البيانات المفلترة
    const originalChildren = this.children;
    this.children = filtered;
    this.renderChildrenTable();
    this.children = originalChildren;
  }
  
  // ==================== Attendance Management ====================
  
  async loadAttendance() {
    console.log('🔵 loadAttendance تم استدعاؤها');
    try {
      // Hide all views
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('children-management').classList.add('hidden');
      document.getElementById('users-management').classList.add('hidden');
      document.getElementById('assessments-view').classList.add('hidden');
      document.getElementById('activities-view').classList.add('hidden');
      document.getElementById('attendance-view').classList.remove('hidden');
      
      this.showLoading(true);
      
      const result = await window.API.getAttendance();
      if (result.success) {
        const attendance = result.data;
        const attendanceList = document.getElementById('attendance-list');
        
        if (attendance.length === 0) {
          attendanceList.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد سجلات حضور</p>';
        } else {
          attendanceList.innerHTML = `
            <table class="w-full text-right">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-sm font-medium text-gray-700">اسم الطفل</th>
                  <th class="px-4 py-3 text-sm font-medium text-gray-700">التاريخ</th>
                  <th class="px-4 py-3 text-sm font-medium text-gray-700">وقت الوصول</th>
                  <th class="px-4 py-3 text-sm font-medium text-gray-700">وقت المغادرة</th>
                  <th class="px-4 py-3 text-sm font-medium text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${attendance.map(record => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">طفل #${record.childId}</td>
                    <td class="px-4 py-3 text-sm">${new Date(record.date).toLocaleDateString('ar-SA')}</td>
                    <td class="px-4 py-3 text-sm">${record.checkInTime || '-'}</td>
                    <td class="px-4 py-3 text-sm">${record.checkOutTime || '-'}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 rounded-full text-xs ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }">
                        ${record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : record.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
        
        this.showToast(`✅ تم تحميل ${attendance.length} سجل حضور`, 'success');
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      this.showToast('❌ خطأ في تحميل سجلات الحضور', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  // ==================== Assessments Management ====================
  
  async loadAssessments() {
    console.log('🔵 loadAssessments تم استدعاؤها');
    try {
      // Hide all views
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('children-management').classList.add('hidden');
      document.getElementById('users-management').classList.add('hidden');
      document.getElementById('attendance-view').classList.add('hidden');
      document.getElementById('activities-view').classList.add('hidden');
      document.getElementById('assessments-view').classList.remove('hidden');
      
      this.showLoading(true);
      
      const result = await window.API.getAssessments();
      if (result.success) {
        const assessments = result.data;
        const assessmentsList = document.getElementById('assessments-list');
        
        if (assessments.length === 0) {
          assessmentsList.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد تقييمات</p>';
        } else {
          assessmentsList.innerHTML = assessments.map(assessment => {
            const typeColors = {
              social: 'bg-blue-100 text-blue-800',
              cognitive: 'bg-purple-100 text-purple-800',
              physical: 'bg-green-100 text-green-800',
              emotional: 'bg-pink-100 text-pink-800'
            };
            
            const typeLabels = {
              social: 'اجتماعي',
              cognitive: 'معرفي',
              physical: 'بدني',
              emotional: 'عاطفي'
            };
            
            return `
              <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="font-semibold text-gray-900 mb-1">طفل #${assessment.childId}</h3>
                    <p class="text-sm text-gray-600">${new Date(assessment.date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium ${typeColors[assessment.type] || 'bg-gray-100 text-gray-800'}">
                    ${typeLabels[assessment.type] || assessment.type}
                  </span>
                </div>
                <p class="text-sm text-gray-700">${this.escapeHtml(assessment.notes || 'لا توجد ملاحظات')}</p>
                <div class="mt-3 flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">التقييم:</span>
                    <span class="font-medium text-sm">${'⭐'.repeat(assessment.score || 0)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
        
        this.showToast(`✅ تم تحميل ${assessments.length} تقييم`, 'success');
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      this.showToast('❌ خطأ في تحميل التقييمات', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  // ==================== Activities Management ====================
  
  async loadActivities() {
    console.log('🔵 loadActivities تم استدعاؤها');
    try {
      // Hide all views
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('children-management').classList.add('hidden');
      document.getElementById('users-management').classList.add('hidden');
      document.getElementById('attendance-view').classList.add('hidden');
      document.getElementById('assessments-view').classList.add('hidden');
      document.getElementById('activities-view').classList.remove('hidden');
      
      this.showLoading(true);
      
      const result = await window.API.getActivities();
      if (result.success) {
        const activities = result.data;
        const activitiesList = document.getElementById('activities-list');
        
        if (activities.length === 0) {
          activitiesList.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد أنشطة</p>';
        } else {
          activitiesList.innerHTML = activities.map(activity => {
            const typeColors = {
              educational: 'bg-blue-100 text-blue-800',
              artistic: 'bg-purple-100 text-purple-800',
              physical: 'bg-green-100 text-green-800',
              recreational: 'bg-yellow-100 text-yellow-800'
            };
            
            const typeLabels = {
              educational: 'تعليمي',
              artistic: 'فني',
              physical: 'رياضي',
              recreational: 'ترفيهي'
            };
            
            return `
              <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 mb-1">${this.escapeHtml(activity.title)}</h3>
                    <p class="text-sm text-gray-600 mb-2">${this.escapeHtml(activity.description || '')}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium ${typeColors[activity.type] || 'bg-gray-100 text-gray-800'}">
                    ${typeLabels[activity.type] || activity.type}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-calendar text-gray-400"></i>
                    <span>${new Date(activity.date).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-clock text-gray-400"></i>
                    <span>${activity.duration} دقيقة</span>
                  </div>
                  ${activity.instructor ? `
                    <div class="flex items-center gap-2">
                      <i class="fas fa-user text-gray-400"></i>
                      <span>${this.escapeHtml(activity.instructor)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('');
        }
        
        this.showToast(`✅ تم تحميل ${activities.length} نشاط`, 'success');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      this.showToast('❌ خطأ في تحميل الأنشطة', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  // ==================== User Management ====================
  
  async loadUsers() {
    console.log('🔵 loadUsers تم استدعاؤها');
    try {
      // Hide all views
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('children-management').classList.add('hidden');
      document.getElementById('users-management').classList.remove('hidden');
      
      this.showLoading(true);
      
      const result = await window.API.getUsers();
      
      if (result.success) {
        const users = result.data;
        const usersList = document.querySelector('#users-list .grid');
        
        const roleLabels = {
          admin: { label: 'مدير', color: 'bg-red-100 text-red-800' },
          staff: { label: 'موظف', color: 'bg-blue-100 text-blue-800' },
          parent: { label: 'ولي أمر', color: 'bg-green-100 text-green-800' }
        };
        
        usersList.innerHTML = users.map(user => {
          const roleInfo = roleLabels[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-800' };
          const isCurrentUser = user.id === this.currentUser.id;
          
          return `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(user.name)}</h3>
                    <span class="${roleInfo.color} px-3 py-1 rounded-full text-xs font-medium">
                      ${roleInfo.label}
                    </span>
                    ${isCurrentUser ? '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">أنت</span>' : ''}
                  </div>
                  <p class="text-sm text-gray-600">📧 ${this.escapeHtml(user.email)}</p>
                  <p class="text-xs text-gray-500 mt-1">تاريخ الإنشاء: ${new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <div class="flex gap-2">
                  ${!isCurrentUser && this.currentUser.role === 'admin' ? `
                    <select onchange="window.nurseryApp?.changeUserRole(${user.id}, this.value)" 
                            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="">تغيير الصلاحية</option>
                      <option value="admin">مدير</option>
                      <option value="staff">موظف</option>
                      <option value="parent">ولي أمر</option>
                    </select>
                    <button onclick="window.nurseryApp?.deleteUserConfirm(${user.id}, '${this.escapeHtml(user.name)}')" 
                            class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                      <i class="fas fa-trash"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
        
      } else {
        this.showToast(result.error || 'فشل تحميل قائمة الموظفين', 'error');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.showToast('حدث خطأ أثناء تحميل قائمة الموظفين', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async changeUserRole(userId, newRole) {
    if (!newRole) return;
    
    if (!confirm(`هل أنت متأكد من تغيير الصلاحية إلى "${newRole}"؟`)) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const result = await window.API.updateUserRole(userId, newRole);
      
      if (result.success) {
        this.showToast('تم تغيير الصلاحية بنجاح', 'success');
        await this.loadUsers();
      } else {
        this.showToast(result.error || 'فشل تغيير الصلاحية', 'error');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      this.showToast('حدث خطأ أثناء تغيير الصلاحية', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  async deleteUserConfirm(userId, userName) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\n\nهذا الإجراء لا يمكن التراجع عنه!`)) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const result = await window.API.deleteUser(userId);
      
      if (result.success) {
        this.showToast('تم حذف المستخدم بنجاح', 'success');
        await this.loadUsers();
      } else {
        this.showToast(result.error || 'فشل حذف المستخدم', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showToast('حدث خطأ أثناء حذف المستخدم', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  showAddUserForm() {
    document.getElementById('user-form-container').classList.remove('hidden');
    document.getElementById('user-form-title').textContent = 'إضافة موظف جديد';
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
  }
  
  cancelUserForm() {
    document.getElementById('user-form-container').classList.add('hidden');
    document.getElementById('user-form').reset();
  }
  
  async handleUserSubmit(e) {
    e.preventDefault();
    
    const userData = {
      name: document.getElementById('user-name').value,
      email: document.getElementById('user-email').value,
      password: document.getElementById('user-password').value,
      role: document.getElementById('user-role').value
    };
    
    try {
      this.showLoading(true);
      
      const result = await window.API.createUser(userData);
      
      if (result.success) {
        this.showToast('تم إضافة الموظف بنجاح', 'success');
        this.cancelUserForm();
        await this.loadUsers();
      } else {
        this.showToast(result.error || 'فشل إضافة الموظف', 'error');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      this.showToast('حدث خطأ أثناء إضافة الموظف', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  // ==================== Reports Management ====================
  
  async loadReports() {
    console.log('🔵 loadReports تم استدعاؤها');
    try {
      // Hide all views
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('children-management').classList.add('hidden');
      document.getElementById('users-management').classList.add('hidden');
      document.getElementById('attendance-view').classList.add('hidden');
      document.getElementById('assessments-view').classList.add('hidden');
      document.getElementById('activities-view').classList.add('hidden');
      document.getElementById('reports-view').classList.remove('hidden');
      
      this.showLoading(true);
      
      // Load all data for reports
      const [childrenRes, attendanceRes, assessmentsRes, activitiesRes] = await Promise.all([
        window.API.getChildren(),
        window.API.getAttendance(),
        window.API.getAssessments(),
        window.API.getActivities()
      ]);
      
      if (childrenRes.success && attendanceRes.success && assessmentsRes.success && activitiesRes.success) {
        const children = childrenRes.data;
        const attendance = attendanceRes.data;
        const assessments = assessmentsRes.data;
        const activities = activitiesRes.data;
        
        // Update stats cards
        document.getElementById('report-total-children').textContent = children.length;
        const presentToday = attendance.filter(a => a.status === 'present').length;
        document.getElementById('report-present-today').textContent = presentToday;
        document.getElementById('report-assessments-count').textContent = assessments.length;
        document.getElementById('report-activities-count').textContent = activities.length;
        
        // Create charts
        this.createAttendanceChart(attendance);
        this.createAssessmentTypesChart(assessments);
        this.createActivityTypesChart(activities);
        this.createAgeDistributionChart(children);
        
        this.showToast('✅ تم تحميل التقارير بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      this.showToast('❌ خطأ في تحميل التقارير', 'error');
    } finally {
      this.showLoading(false);
    }
  }
  
  createAttendanceChart(attendance) {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }
    
    // Group by date and count present/absent
    const last7Days = [];
    const presentCounts = [];
    const absentCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(date.toLocaleDateString('ar-SA', { weekday: 'short' }));
      
      const dayAttendance = attendance.filter(a => a.date.startsWith(dateStr));
      presentCounts.push(dayAttendance.filter(a => a.status === 'present').length);
      absentCounts.push(dayAttendance.filter(a => a.status === 'absent').length);
    }
    
    this.attendanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [
          {
            label: 'حاضر',
            data: presentCounts,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'غائب',
            data: absentCounts,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: window.innerWidth < 768 ? 'bottom' : 'top',
            rtl: true,
            labels: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              },
              padding: window.innerWidth < 768 ? 8 : 10
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              }
            }
          }
        }
      }
    });
  }
  
  createAssessmentTypesChart(assessments) {
    const ctx = document.getElementById('assessmentTypesChart');
    if (!ctx) return;
    
    if (this.assessmentTypesChart) {
      this.assessmentTypesChart.destroy();
    }
    
    // Count by type
    const types = {
      social: 0,
      cognitive: 0,
      physical: 0,
      emotional: 0
    };
    
    assessments.forEach(a => {
      if (types.hasOwnProperty(a.type)) {
        types[a.type]++;
      }
    });
    
    const labels = {
      social: 'اجتماعي',
      cognitive: 'معرفي',
      physical: 'بدني',
      emotional: 'عاطفي'
    };
    
    this.assessmentTypesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(types).map(k => labels[k]),
        datasets: [{
          data: Object.values(types),
          backgroundColor: [
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(34, 197, 94)',
            'rgb(236, 72, 153)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: window.innerWidth < 768 ? 'bottom' : 'right',
            rtl: true,
            labels: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              },
              padding: window.innerWidth < 768 ? 5 : 10
            }
          }
        }
      }
    });
  }
  
  createActivityTypesChart(activities) {
    const ctx = document.getElementById('activityTypesChart');
    if (!ctx) return;
    
    if (this.activityTypesChart) {
      this.activityTypesChart.destroy();
    }
    
    const types = {
      educational: 0,
      artistic: 0,
      physical: 0,
      recreational: 0
    };
    
    activities.forEach(a => {
      if (types.hasOwnProperty(a.type)) {
        types[a.type]++;
      }
    });
    
    const labels = {
      educational: 'تعليمي',
      artistic: 'فني',
      physical: 'رياضي',
      recreational: 'ترفيهي'
    };
    
    this.activityTypesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(types).map(k => labels[k]),
        datasets: [{
          label: 'عدد الأنشطة',
          data: Object.values(types),
          backgroundColor: [
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: window.innerWidth < 768 ? 9 : 12
              }
            }
          }
        }
      }
    });
  }
  
  createAgeDistributionChart(children) {
    const ctx = document.getElementById('ageDistributionChart');
    if (!ctx) return;
    
    if (this.ageDistributionChart) {
      this.ageDistributionChart.destroy();
    }
    
    // Calculate ages and group
    const ageGroups = {
      '0-2': 0,
      '3-4': 0,
      '5-6': 0
    };
    
    const now = new Date();
    children.forEach(child => {
      if (child.dateOfBirth) {
        const birthDate = new Date(child.dateOfBirth);
        const age = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (age <= 2) ageGroups['0-2']++;
        else if (age <= 4) ageGroups['3-4']++;
        else ageGroups['5-6']++;
      }
    });
    
    this.ageDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(ageGroups).map(k => `${k} سنوات`),
        datasets: [{
          data: Object.values(ageGroups),
          backgroundColor: [
            'rgb(251, 191, 36)',
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: window.innerWidth < 768 ? 'bottom' : 'right',
            rtl: true,
            labels: {
              font: {
                size: window.innerWidth < 768 ? 10 : 12
              },
              padding: window.innerWidth < 768 ? 5 : 10
            }
          }
        }
      }
    });
  }
  
  // ==================== Event Binding ====================
  
  bindEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Logout buttons (multiple locations)
    const logoutBtns = document.querySelectorAll('[id^="logout-btn"]');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleLogout());
    });
    
    // Back to dashboard (multiple buttons)
    const backBtns = document.querySelectorAll('[id^="back-to-dashboard"]');
    backBtns.forEach(btn => {
      btn.addEventListener('click', () => this.backToDashboard());
    });
    
    // Add child button
    const addChildBtn = document.getElementById('add-child-btn');
    if (addChildBtn) {
      addChildBtn.addEventListener('click', () => this.showAddChildForm());
    }
    
    // Cancel add child
    const cancelBtn = document.getElementById('cancel-add-child');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelAddChild());
    }
    
    // Child form submission
    const childForm = document.getElementById('child-form');
    if (childForm) {
      childForm.addEventListener('submit', (e) => this.handleChildSubmit(e));
    }
    
    // Search
    const searchInput = document.getElementById('search-child');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }
    
    // User management
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.showAddUserForm());
    }
    
    const cancelUserBtn = document.getElementById('cancel-user-form');
    if (cancelUserBtn) {
      cancelUserBtn.addEventListener('click', () => this.cancelUserForm());
    }
    
    const userForm = document.getElementById('user-form');
    if (userForm) {
      userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
    }
    
    // Print buttons
    const printReportsBtn = document.getElementById('print-reports-btn');
    if (printReportsBtn) {
      printReportsBtn.addEventListener('click', () => this.printReports());
    }
    
    const printAttendanceBtn = document.getElementById('print-attendance-btn');
    if (printAttendanceBtn) {
      printAttendanceBtn.addEventListener('click', () => this.printAttendance());
    }
    
    const printChildrenBtn = document.getElementById('print-children-btn');
    if (printChildrenBtn) {
      printChildrenBtn.addEventListener('click', () => this.printChildren());
    }
  }
  
  // ==================== Print Functions ====================
  
  printReports() {
    console.log('🖨️ طباعة التقرير...');
    
    // Add print-specific elements
    const reportsView = document.getElementById('reports-view');
    if (!reportsView) {
      alert('❌ خطأ: لم يتم العثور على صفحة التقارير');
      return;
    }
    
    // Create print header
    const printHeader = document.createElement('div');
    printHeader.className = 'print-header';
    printHeader.innerHTML = `
      <h1 style="font-size: 24pt; font-weight: bold;">داري الحنونة الأهلية لضيافة الأطفال</h1>
      <p style="font-size: 12pt;">التقارير والإحصائيات</p>
      <p style="font-size: 10pt;">الهفوف - السلمانية الشمالية | 0546425459</p>
    `;
    
    const printDate = document.createElement('div');
    printDate.className = 'print-date';
    printDate.innerHTML = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    
    const mainContent = reportsView.querySelector('main');
    if (mainContent) {
      mainContent.insertBefore(printDate, mainContent.firstChild);
      mainContent.insertBefore(printHeader, mainContent.firstChild);
    }
    
    // Show initial notification
    this.showToast('📄 استخدم قائمة المتصفح ← مشاركة ← طباعة', 'info');
    
    // Try to open print dialog
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print error:', error);
      }
      
      // Show detailed instructions for mobile users
      setTimeout(() => {
        const msg = '📱 للطباعة من الآيفون/جوال:\n' +
                    '1. اضغط على زر المشاركة (⎋) في الأعلى\n' +
                    '2. اختر "طباعة" من القائمة\n\n' +
                    '💻 للطباعة من الكمبيوتر:\n' +
                    '• Windows: Ctrl + P\n' +
                    '• Mac: Cmd + P';
        alert(msg);
      }, 800);
    }, 100);
    
    // Remove print elements after printing
    setTimeout(() => {
      if (printHeader.parentNode) printHeader.remove();
      if (printDate.parentNode) printDate.remove();
    }, 2000);
  }
  
  printAttendance() {
    console.log('🖨️ طباعة كشف الحضور...');
    
    const attendanceView = document.getElementById('attendance-view');
    if (!attendanceView) {
      alert('❌ خطأ: لم يتم العثور على صفحة الحضور');
      return;
    }
    
    // Create print header
    const printHeader = document.createElement('div');
    printHeader.className = 'print-header';
    printHeader.innerHTML = `
      <h1 style="font-size: 24pt; font-weight: bold;">داري الحنونة الأهلية لضيافة الأطفال</h1>
      <p style="font-size: 12pt;">كشف الحضور والغياب</p>
      <p style="font-size: 10pt;">الهفوف - السلمانية الشمالية | 0546425459</p>
    `;
    
    const printDate = document.createElement('div');
    printDate.className = 'print-date';
    printDate.innerHTML = `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`;
    
    const mainContent = attendanceView.querySelector('main');
    if (mainContent) {
      mainContent.insertBefore(printDate, mainContent.firstChild);
      mainContent.insertBefore(printHeader, mainContent.firstChild);
    }
    
    // Show initial notification
    this.showToast('📄 استخدم قائمة المتصفح ← مشاركة ← طباعة', 'info');
    
    // Try to open print dialog
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print error:', error);
      }
      
      // Show detailed instructions for mobile users
      setTimeout(() => {
        const msg = '📱 للطباعة من الآيفون/جوال:\n' +
                    '1. اضغط على زر المشاركة (⎋) في الأعلى\n' +
                    '2. اختر "طباعة" من القائمة\n\n' +
                    '💻 للطباعة من الكمبيوتر:\n' +
                    '• Windows: Ctrl + P\n' +
                    '• Mac: Cmd + P';
        alert(msg);
      }, 800);
    }, 100);
    
    // Remove print elements after printing
    setTimeout(() => {
      if (printHeader.parentNode) printHeader.remove();
      if (printDate.parentNode) printDate.remove();
    }, 2000);
  }
  
  printChildren() {
    console.log('🖨️ طباعة قائمة الأطفال...');
    
    const childrenManagement = document.getElementById('children-management');
    if (!childrenManagement) {
      alert('❌ خطأ: لم يتم العثور على صفحة الأطفال');
      return;
    }
    
    // Create print header
    const printHeader = document.createElement('div');
    printHeader.className = 'print-header';
    printHeader.innerHTML = `
      <h1 style="font-size: 24pt; font-weight: bold;">داري الحنونة الأهلية لضيافة الأطفال</h1>
      <p style="font-size: 12pt;">قائمة الأطفال المسجلين</p>
      <p style="font-size: 10pt;">الهفوف - السلمانية الشمالية | 0546425459</p>
    `;
    
    const printDate = document.createElement('div');
    printDate.className = 'print-date';
    printDate.innerHTML = `التاريخ: ${new Date().toLocaleDateString('ar-SA')} | العدد الكلي: ${this.children.length} طفل/طفلة`;
    
    const mainContent = childrenManagement.querySelector('main');
    if (mainContent) {
      mainContent.insertBefore(printDate, mainContent.firstChild);
      mainContent.insertBefore(printHeader, mainContent.firstChild);
    }
    
    // Show initial notification
    this.showToast('📄 استخدم قائمة المتصفح ← مشاركة ← طباعة', 'info');
    
    // Try to open print dialog
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print error:', error);
      }
      
      // Show detailed instructions for mobile users
      setTimeout(() => {
        const msg = '📱 للطباعة من الآيفون/جوال:\n' +
                    '1. اضغط على زر المشاركة (⎋) في الأعلى\n' +
                    '2. اختر "طباعة" من القائمة\n\n' +
                    '💻 للطباعة من الكمبيوتر:\n' +
                    '• Windows: Ctrl + P\n' +
                    '• Mac: Cmd + P';
        alert(msg);
      }, 800);
    }, 100);
    
    // Remove print elements after printing
    setTimeout(() => {
      if (printHeader.parentNode) printHeader.remove();
      if (printDate.parentNode) printDate.remove();
    }, 2000);
  }
}

// ==================== Initialize App ====================

document.addEventListener('DOMContentLoaded', () => {
  window.nurseryApp = new NurseryApp();
});
