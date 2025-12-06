// API Client for Nursery Management System
class NurseryAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('nursery_token');
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Handle API response
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - only logout if we have a token
        if (this.token) {
          this.token = null;
          localStorage.removeItem('nursery_token');
          localStorage.removeItem('nursery_user');
        }
        throw new Error('جلسة منتهية - يرجى تسجيل الدخول مرة أخرى');
      }
      throw new Error(data.error || 'حدث خطأ في الاتصال');
    }
    
    return data;
  }

  // ==================== Authentication ====================
  
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await this.handleResponse(response);
    
    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('nursery_token', this.token);
      localStorage.setItem('nursery_user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async register(email, password, name, role = 'staff') {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });
    
    const data = await this.handleResponse(response);
    
    if (data.success && data.data.token) {
      this.token = data.data.token;
      localStorage.setItem('nursery_token', this.token);
      localStorage.setItem('nursery_user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async getCurrentUser() {
    // Don't make request if no token exists
    if (!this.token) {
      return { success: false, error: 'No authentication token' };
    }
    
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('nursery_token');
    localStorage.removeItem('nursery_user');
    // Don't reload - let the app handle UI updates
    return { success: true };
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem('nursery_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ==================== Children ====================
  
  async getChildren(status = null) {
    const url = status ? `${this.baseURL}/nursery/children?status=${status}` : `${this.baseURL}/nursery/children`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async getChild(id) {
    const response = await fetch(`${this.baseURL}/nursery/children/${id}`, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async createChild(childData) {
    const response = await fetch(`${this.baseURL}/nursery/children`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(childData)
    });
    
    return await this.handleResponse(response);
  }

  async updateChild(id, childData) {
    const response = await fetch(`${this.baseURL}/nursery/children/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(childData)
    });
    
    return await this.handleResponse(response);
  }

  async deleteChild(id) {
    const response = await fetch(`${this.baseURL}/nursery/children/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  // ==================== Attendance ====================
  
  async getAttendance(date = null, childId = null) {
    let url = `${this.baseURL}/nursery/attendance?`;
    if (date) url += `date=${date}&`;
    if (childId) url += `childId=${childId}&`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async recordAttendance(attendanceData) {
    const response = await fetch(`${this.baseURL}/nursery/attendance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(attendanceData)
    });
    
    return await this.handleResponse(response);
  }

  async updateAttendance(id, attendanceData) {
    const response = await fetch(`${this.baseURL}/nursery/attendance/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(attendanceData)
    });
    
    return await this.handleResponse(response);
  }

  // ==================== Assessments ====================
  
  async getAssessments(childId = null, type = null) {
    let url = `${this.baseURL}/nursery/assessments?`;
    if (childId) url += `childId=${childId}&`;
    if (type) url += `type=${type}&`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async createAssessment(assessmentData) {
    const response = await fetch(`${this.baseURL}/nursery/assessments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assessmentData)
    });
    
    return await this.handleResponse(response);
  }

  async updateAssessment(id, assessmentData) {
    const response = await fetch(`${this.baseURL}/nursery/assessments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(assessmentData)
    });
    
    return await this.handleResponse(response);
  }

  // ==================== Activities ====================
  
  async getActivities(status = null, date = null) {
    let url = `${this.baseURL}/nursery/activities?`;
    if (status) url += `status=${status}&`;
    if (date) url += `date=${date}&`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async createActivity(activityData) {
    const response = await fetch(`${this.baseURL}/nursery/activities`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(activityData)
    });
    
    return await this.handleResponse(response);
  }

  // ==================== Statistics ====================
  
  async getDashboardStats() {
    const response = await fetch(`${this.baseURL}/nursery/stats/dashboard`, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  // ==================== User Management (Admin Only) ====================
  
  async getUsers() {
    const response = await fetch(`${this.baseURL}/admin/users`, {
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseURL}/admin/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    
    return await this.handleResponse(response);
  }

  async updateUserRole(userId, role) {
    const response = await fetch(`${this.baseURL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role })
    });
    
    return await this.handleResponse(response);
  }

  async deleteUser(userId) {
    const response = await fetch(`${this.baseURL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
  }
}

// Create global API instance
const api = new NurseryAPI();

// Export to window for global access
if (typeof window !== 'undefined') {
  window.API = api;
  window.NurseryAPI = NurseryAPI;
  
  console.log('✅ Nursery API Client loaded successfully');
}
