import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee API calls
export const employeeApi = {
  // Get all employees with optional filters
  getAll: (params = {}) => api.get('/employees', { params }),
  
  // Get single employee
  getById: (id) => api.get(`/employees/${id}`),
  
  // Create new employee
  create: (data) => api.post('/employees', data),
  
  // Update employee
  update: (id, data) => api.put(`/employees/${id}`, data),
  
  // Delete employee
  delete: (id) => api.delete(`/employees/${id}`),
  
  // Get hierarchy
  getHierarchy: () => api.get('/employees/hierarchy/tree'),

  // Update employee's manager
  updateManager: (employeeId, managerId) => api.put(`/employees/${employeeId}/manager`, { managerId }),
};

// Helper function to handle API errors
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

export default api;