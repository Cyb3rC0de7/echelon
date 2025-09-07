import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const employeeApi = {
  getAll: (params = {}) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getHierarchy: () => api.get('/employees/hierarchy/tree'),
  updateManager: (employeeId, managerId) => api.put(`/employees/${employeeId}/manager`, { managerId }),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  resetPassword: (employeeId) => api.put(`/auth/reset-password/${employeeId}`),
  logout: () => api.post('/auth/logout'), // Client-side token removal
  getMe: () => api.get('/auth/me'),
};


export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  bulkUpdatePermissions: (updates) => api.put('/admin/bulk-permissions', { updates }),
  exportEmployees: (format) => api.get(`/admin/export/${format}`, { responseType: format === 'csv' ? 'blob' : 'json' }),
  checkSystemHealth: () => api.get('/admin/health'),
};

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.error || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error - please check your connection';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

export { api };