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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { employeeApi, handleApiError } from '../services/api';

const EmployeeForm = ({ employee = null, onSuccess, onError, onCancel }) => {
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    surname: '',
    email: '',
    birthDate: null,
    salary: '',
    role: '',
    managerId: ''
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const roles = [
    'CEO',
    'CTO',
    'CFO',
    'VP Engineering',
    'VP Sales',
    'VP Marketing',
    'Development Lead',
    'Team Lead',
    'Senior Developer',
    'Software Developer',
    'Junior Developer',
    'DevOps Engineer',
    'QA Engineer',
    'Product Manager',
    'HR Manager',
    'Finance Manager',
    'Sales Manager',
    'Marketing Manager'
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeApi.getAll();
        setEmployees(response.data);
      } catch (error) {
        onError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();

    if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber || '',
        name: employee.name || '',
        surname: employee.surname || '',
        email: employee.email || '',
        birthDate: employee.birthDate ? dayjs(employee.birthDate) : null,
        salary: employee.salary || '',
        role: employee.role || '',
        managerId: employee.manager?.id || ''
      });
    }
  }, [employee, onError]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, birthDate: date }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.employeeNumber.trim()) errors.push('Employee number is required');
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.surname.trim()) errors.push('Surname is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.birthDate) errors.push('Birth date is required');
    if (!formData.salary || parseFloat(formData.salary) <= 0) errors.push('Valid salary is required');
    if (!formData.role.trim()) errors.push('Role is required');

    //Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Valid email address is required');
    }

    //Prevent employee being their own manager
    if (formData.managerId && employee && formData.managerId === employee.id) {
      errors.push('Employee cannot be their own manager');
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
        salary: parseFloat(formData.salary),
        managerId: formData.managerId || null
      };

      if (employee) {
        await employeeApi.update(employee.id, payload);
        onSuccess('Employee updated successfully!');
      } else {
        await employeeApi.create(payload);
        onSuccess('Employee created successfully!');
      }
    } catch (error) {
      onError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

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
              disabled={!!employee}
            />
          </Grid>
          <Grid>
            <TextField
              label="First Name"
              fullWidth
              value={formData.name}
              onChange={handleChange('name')}
            />
          </Grid>
          <Grid>
            <TextField
              label="Last Name"
              fullWidth
              value={formData.surname}
              onChange={handleChange('surname')}
            />
          </Grid>
          <Grid>
            <TextField
              label="Email"
              fullWidth
              value={formData.email}
              onChange={handleChange('email')}
              type="email"
            />
          </Grid>
          <Grid>
            <DatePicker
              label="Birth Date"
              value={formData.birthDate}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid>
            <TextField
              label="Salary"
              fullWidth
              type="number"
              value={formData.salary}
              onChange={handleChange('salary')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleChange('role')}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Manager</InputLabel>
              <Select
                value={formData.managerId}
                label="Manager"
                onChange={handleChange('managerId')}
              >
                <MenuItem value="">
                  <em>No Manager</em>
                </MenuItem>
                {employees
                  .filter((emp) => !employee || emp.id !== employee.id)
                  .map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} {emp.surname} ({emp.employeeNumber})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          {employee && (
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