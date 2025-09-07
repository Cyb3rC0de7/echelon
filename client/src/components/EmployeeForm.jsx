import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { employeeApi, handleApiError } from '../services/api';
import { useAuth } from '../App';

const EmployeeForm = ({ employee = null, currentUser, canEdit = true, onSuccess, onError, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    surname: '',
    email: '',
    birthDate: null,
    salary: '',
    role: '',
    permissionLevel: 'employee',
    managerId: '',
    isActive: true
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const roles = [
    'CEO', 'CTO', 'CFO', 'VP Engineering', 'VP Sales', 'VP Marketing',
    'Development Lead', 'Team Lead', 'Senior Developer', 'Software Developer',
    'Junior Developer', 'DevOps Engineer', 'QA Engineer', 'Product Manager',
    'HR Manager', 'Finance Manager', 'Sales Manager', 'Marketing Manager',
    'Accountant', 'Sales Executive', 'Marketing Specialist', 'Intern'
  ];

  // Permission checks - use passed currentUser or fallback to user from context
  const currentUserData = currentUser || user;
  const isAdmin = currentUserData?.permissionLevel === 'admin';
  const isHR = currentUserData?.permissionLevel === 'hr';
  const isManager = currentUserData?.permissionLevel === 'manager';
  const isEmployee = currentUserData?.permissionLevel === 'employee';

  // Field edit permissions - simplified logic
  const canEditBasicInfo = canEdit && (
    isAdmin || 
    isHR || 
    employee?.id === currentUserData?.id || // Can edit themselves
    (isManager && employee?.manager?.id === currentUserData?.id) // Manager editing direct report
  );

  const canEditRole = canEdit && (isAdmin || isHR);
  const canEditSalary = canEdit && (isAdmin || isHR);
  const canEditPermissionLevel = canEdit && isAdmin;
  const canEditManager = canEdit && (isAdmin || isHR || (isManager && employee?.manager?.id === currentUserData?.id));
  const canEditStatus = canEdit && isAdmin;
  const canCreateEmployee = isAdmin || isHR;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeApi.getAll();
        let filteredEmployees = response.data;
        
        // Filter employees for manager selection based on permissions
        if (isManager && !isAdmin && !isHR) {
          filteredEmployees = response.data.filter(emp => 
            emp.permissionLevel === 'admin' ||
            emp.permissionLevel === 'hr' ||
            emp.permissionLevel === 'manager' ||
            emp.manager?.id === currentUserData?.id
          );
        }
        
        setEmployees(filteredEmployees);
      } catch (error) {
        onError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();

    // Initialize form data
    if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber || '',
        name: employee.name || '',
        surname: employee.surname || '',
        email: employee.email || '',
        birthDate: employee.birthDate ? dayjs(employee.birthDate) : null,
        salary: employee.salary || '',
        role: employee.role || '',
        permissionLevel: employee.permissionLevel || 'employee',
        managerId: employee.manager?.id || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true
      });
    }
  }, [employee, onError, isAdmin, isHR, isManager, currentUserData?.id]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, birthDate: date }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.employeeNumber.trim()) errors.push('Employee number is required');
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.surname.trim()) errors.push('Surname is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.birthDate) errors.push('Birth date is required');
    if (!formData.role.trim()) errors.push('Role is required');
    
    if (canEditSalary && (!formData.salary || parseFloat(formData.salary) <= 0)) {
      errors.push('Valid salary is required');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Valid email address is required');
    }

    // Prevent employee being their own manager
    if (formData.managerId && employee && formData.managerId === employee.id) {
      errors.push('Employee cannot be their own manager');
    }

    // HR cannot set permission level to admin
    if (isHR && !isAdmin && formData.permissionLevel === 'admin') {
      errors.push('HR cannot assign admin privileges');
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        birthDate: formData.birthDate ? formData.birthDate.toISOString() : null,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        managerId: formData.managerId || null
      };

      // Build final payload based on permissions
      const finalPayload = {};
      
      if (canEditBasicInfo) {
        finalPayload.employeeNumber = payload.employeeNumber;
        finalPayload.name = payload.name;
        finalPayload.surname = payload.surname;
        finalPayload.email = payload.email;
        finalPayload.birthDate = payload.birthDate;
      }
      
      if (canEditSalary && payload.salary !== undefined) {
        finalPayload.salary = payload.salary;
      }
      
      if (canEditRole) {
        finalPayload.role = payload.role;
      }
      
      if (canEditPermissionLevel) {
        // HR cannot set admin level
        if (!(isHR && !isAdmin && payload.permissionLevel === 'admin')) {
          finalPayload.permissionLevel = payload.permissionLevel;
        }
      }
      
      if (canEditStatus) {
        finalPayload.isActive = payload.isActive;
      }
      
      if (canEditManager) {
        finalPayload.managerId = payload.managerId;
      }

      if (employee) {
        await employeeApi.update(employee.id, finalPayload);
        onSuccess('Employee updated successfully!');
      } else {
        await employeeApi.create(finalPayload);
        onSuccess('Employee created successfully!');
      }
    } catch (error) {
      onError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  // Don't allow non-authorized users to create employees
  if (!employee && !canCreateEmployee) {
    return (
      <Alert severity="error">
        You don't have permission to create employees.
      </Alert>
    );
  }

  // Don't allow editing if canEdit is false
  if (employee && !canEdit) {
    return (
      <Alert severity="error">
        You don't have permission to edit this employee.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {employee ? 'Edit Employee' : 'Add Employee'}
      </Typography>
      
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid>
            <TextField
              label="Employee Number"
              fullWidth
              value={formData.employeeNumber}
              onChange={handleChange('employeeNumber')}
              disabled={!!employee || !canEditBasicInfo}
            />
          </Grid>
          
          <Grid>
            <TextField
              label="First Name"
              fullWidth
              value={formData.name}
              onChange={handleChange('name')}
              disabled={!canEditBasicInfo}
            />
          </Grid>
          
          <Grid>
            <TextField
              label="Last Name"
              fullWidth
              value={formData.surname}
              onChange={handleChange('surname')}
              disabled={!canEditBasicInfo}
            />
          </Grid>
          
          <Grid>
            <TextField
              label="Email"
              fullWidth
              value={formData.email}
              onChange={handleChange('email')}
              type="email"
              disabled={!canEditBasicInfo}
            />
          </Grid>
          
          <Grid>
            <DatePicker
              label="Birth Date"
              value={formData.birthDate}
              onChange={handleDateChange}
              disabled={!canEditBasicInfo}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          
          {canEditSalary && (
            <Grid>
              <TextField
                label="Salary"
                fullWidth
                type="number"
                value={formData.salary}
                onChange={handleChange('salary')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>
                }}
              />
            </Grid>
          )}
          
          <Grid>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleChange('role')}
                disabled={!canEditRole}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
              {!canEditRole && (
                <Typography variant="caption" color="text.secondary">
                  You don't have permission to change roles
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Manager</InputLabel>
              <Select
                value={formData.managerId}
                label="Manager"
                onChange={handleChange('managerId')}
                disabled={!canEditManager}
              >
                <MenuItem value="">
                  <em>No Manager</em>
                </MenuItem>
                {employees
                  .filter(emp => !employee || emp.id !== employee.id)
                  .filter(emp => {
                    // Prevent circular management
                    if (employee) {
                      return emp.manager?.id !== employee.id;
                    }
                    return true;
                  })
                  .map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} {emp.surname} ({emp.employeeNumber})
                    </MenuItem>
                  ))}
              </Select>
              {!canEditManager && (
                <Typography variant="caption" color="text.secondary">
                  You don't have permission to assign managers
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Admin-only fields */}
          {canEditPermissionLevel && (
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Permission Level</InputLabel>
                <Select
                  value={formData.permissionLevel}
                  label="Permission Level"
                  onChange={handleChange('permissionLevel')}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  {isAdmin && <MenuItem value="admin">Admin</MenuItem>}
                </Select>
                {isHR && !isAdmin && (
                  <Typography variant="caption" color="text.secondary">
                    HR cannot assign admin privileges
                  </Typography>
                )}
              </FormControl>
            </Grid>
          )}
          
          {canEditStatus && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleSwitchChange('isActive')}
                  />
                }
                label="Active Employee"
              />
            </Grid>
          )}
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            type="submit"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {employee ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default EmployeeForm;