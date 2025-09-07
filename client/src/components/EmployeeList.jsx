import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  AttachMoney as SalaryIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import md5 from 'blueimp-md5';
import { employeeApi, authApi, handleApiError } from '../services/api';
import { useAuth } from '../App';
import EmployeeForm from './EmployeeForm';

const EmployeeList = ({ refreshTrigger, onNotification, onRefresh }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]); // Store all employees for filtering
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, employee: null });
  const [viewMode, setViewMode] = useState('table');
  const [activePermissionFilter, setActivePermissionFilter] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    hr: 0,
    managers: 0,
    employees: 0,
    inactive: 0
  });

  // Permission checks
  const isAdmin = user?.permissionLevel === 'admin';
  const isHR = user?.permissionLevel === 'hr';
  const isManager = user?.permissionLevel === 'manager';
  const isEmployee = user?.permissionLevel === 'employee';

  // Check if user can see salary
  const canSeeSalary = (employee) => {
    return isAdmin || isHR || employee.id === user?.id;
  };

  // Check if user can edit employee
  const canEditEmployee = (employee) => {
    if (isAdmin || isHR) return true;
    if (isManager && employee.manager?.id === user?.id) return true;
    if (isEmployee && employee.id === user?.id) return true;
    return false;
  };

  // Check if user can delete employee
  const canDeleteEmployee = (employee) => {
    if (isAdmin) return true;
    if (isHR && employee.permissionLevel !== 'admin') return true;
    return false;
  };

  // Check if user can reset password
  const canResetPassword = (employee) => {
    return isAdmin;
  };

  // Check if user can toggle active status
  const canToggleActive = (employee) => {
    return isAdmin;
  };

  // Filter employees based on permissions
  const getVisibleEmployees = (employeeList) => {
    if (isAdmin || isHR) return employeeList;
    if (isManager) {
      return employeeList.filter(emp => 
        emp.manager?.id === user?.id ||
        emp.permissionLevel === 'admin' ||
        emp.permissionLevel === 'hr' ||
        emp.permissionLevel === 'manager' ||
        emp.id === user?.id
      );
    }
    if (isEmployee) {
      return employeeList.filter(emp =>
        emp.id === user?.id ||
        emp.id === user?.manager?.id ||
        (emp.manager?.id === user?.manager?.id && emp.id !== user?.id)
      );
    }
    return [];
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll({ search: searchTerm });
      const allEmployeesData = response.data;
      setAllEmployees(allEmployeesData);
      
      // Apply filters
      let filteredEmployees = allEmployeesData;
      
      // Apply permission filter
      if (activePermissionFilter) {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.permissionLevel === activePermissionFilter
        );
      }
      
      // Apply status filter
      if (activeStatusFilter !== null) {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.isActive === activeStatusFilter
        );
      }
      
      const visibleEmployees = getVisibleEmployees(filteredEmployees);
      setEmployees(visibleEmployees);
      
      // Calculate stats for admin view
      if (isAdmin) {
        const stats = {
          total: allEmployeesData.length,
          admins: allEmployeesData.filter(emp => emp.permissionLevel === 'admin').length,
          hr: allEmployeesData.filter(emp => emp.permissionLevel === 'hr').length,
          managers: allEmployeesData.filter(emp => emp.permissionLevel === 'manager').length,
          employees: allEmployeesData.filter(emp => emp.permissionLevel === 'employee').length,
          inactive: allEmployeesData.filter(emp => !emp.isActive).length
        };
        setStats(stats);
      }
    } catch (error) {
      onNotification(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger, searchTerm, activePermissionFilter, activeStatusFilter]);

  const handlePermissionFilterClick = (permissionLevel) => {
    if (activePermissionFilter === permissionLevel) {
      setActivePermissionFilter(null); // Clear filter if already active
    } else {
      setActivePermissionFilter(permissionLevel);
    }
  };

  const handleStatusFilterClick = (status) => {
    if (activeStatusFilter === status) {
      setActiveStatusFilter(null); // Clear filter if already active
    } else {
      setActiveStatusFilter(status);
    }
  };

  const clearAllFilters = () => {
    setActivePermissionFilter(null);
    setActiveStatusFilter(null);
    setSearchTerm('');
  };

  const handleEdit = (employee) => {
    if (!canEditEmployee(employee)) {
      onNotification('You do not have permission to edit this employee', 'error');
      return;
    }
    setEditEmployee(employee);
  };

  const handleDelete = async (employee) => {
    if (!canDeleteEmployee(employee)) {
      onNotification('You do not have permission to delete this employee', 'error');
      return;
    }

    const prevEmployees = [...employees];
    setEmployees((curr) => curr.filter((e) => e.id !== employee.id));

    try {
      await employeeApi.delete(employee.id);
      onNotification('Employee deleted successfully');
      setDeleteDialog({ open: false, employee: null });
      onRefresh();
    } catch (error) {
      setEmployees(prevEmployees);
      onNotification(handleApiError(error), 'error');
    }
  };

  const handleToggleActive = async (employee) => {
    if (!canToggleActive(employee)) {
      onNotification('You do not have permission to change employee status', 'error');
      return;
    }

    try {
      await employeeApi.update(employee.id, {
        ...employee,
        isActive: !employee.isActive
      });
      onNotification(`Employee ${employee.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchEmployees();
    } catch (error) {
      onNotification('Failed to update employee status', 'error');
    }
  };

  const handleResetPassword = async (employee) => {
    if (!canResetPassword(employee)) {
      onNotification('You do not have permission to reset passwords', 'error');
      return;
    }

    try {
      const response = await authApi.resetPassword(employee.id);
      onNotification(`Password reset successfully. New password: ${response.data.defaultPassword}`);
      setResetPasswordDialog({ open: false, employee: null });
      fetchEmployees();
    } catch (error) {
      onNotification('Failed to reset password', 'error');
    }
  };

  const getGravatarUrl = (email, size = 40) => {
    if (!email) return `https://www.gravatar.com/avatar/?s=${size}&d=identicon`;
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

  const getPermissionColor = (level) => {
    const colors = {
      admin: 'error',
      hr: 'warning',
      manager: 'info',
      employee: 'default'
    };
    return colors[level] || 'default';
  };

  const StatCard = ({ title, value, icon, color = 'primary', filterType, filterValue, onClick }) => (
    <Card 
      sx={{ 
        cursor: isAdmin && onClick ? 'pointer' : 'default',
        border: isAdmin && activePermissionFilter === filterValue ? `2px solid` : 'none',
        borderColor: `${color}.main`,
        transition: 'all 0.2s ease',
        '&:hover': isAdmin && onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {}
      }}
      onClick={isAdmin && onClick ? () => onClick(filterValue) : undefined}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" color={color}>
              {value}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar 
          src={getGravatarUrl(params.row?.email || '', 40)}
          sx={{ width: 32, height: 32 }}
        >
          <PersonIcon />
        </Avatar>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'employeeNumber',
      headerName: 'Employee #',
      width: 120,
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      width: 200,
      valueGetter: (value, row) => `${row?.name || ''} ${row?.surname || ''}`,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 180,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    ...(isAdmin || isHR ? [{
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      valueFormatter: (params) => `R${Number(params).toLocaleString()}`,
    }] : []),
    {
      field: 'manager',
      headerName: 'Manager',
      width: 180,
      valueGetter: (value, row) =>
        row?.manager ? `${row.manager.name} ${row.manager.surname}` : 'No Manager',
    },
    ...(isAdmin ? [{
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.row.isActive}
              onChange={() => handleToggleActive(params.row)}
              size="small"
            />
          }
          label={params.row.isActive ? 'Active' : 'Inactive'}
        />
      )
    }] : []),
    {
      field: 'actions',
      headerName: 'Actions',
      width: isAdmin ? 180 : 120,
      renderCell: (params) => (
        <Box>
          {canEditEmployee(params.row) && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canResetPassword(params.row) && (
            <Tooltip title="Reset Password">
              <IconButton
                size="small"
                onClick={() => setResetPasswordDialog({ open: true, employee: params.row })}
                color="warning"
              >
                <LockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDeleteEmployee(params.row) && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => setDeleteDialog({ open: true, employee: params.row })}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            {isAdmin ? 'Employee Management' : 'Employee Directory'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEmployees}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Statistics for Admin */}
        {isAdmin && (
          <>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid>
                  <StatCard
                    title="Total"
                    value={stats.total}
                    icon={<PeopleIcon fontSize="large" />}
                    color="primary"
                    filterValue={null}
                    onClick={clearAllFilters}
                  />
                </Grid>
                <Grid>
                  <StatCard
                    title="Admins"
                    value={stats.admins}
                    icon={<SecurityIcon fontSize="large" />}
                    color="error"
                    filterValue="admin"
                    onClick={handlePermissionFilterClick}
                  />
                </Grid>
                <Grid>
                  <StatCard
                    title="HR"
                    value={stats.hr}
                    icon={<BusinessIcon fontSize="large" />}
                    color="warning"
                    filterValue="hr"
                    onClick={handlePermissionFilterClick}
                  />
                </Grid>
                <Grid>
                  <StatCard
                    title="Managers"
                    value={stats.managers}
                    icon={<AssessmentIcon fontSize="large" />}
                    color="info"
                    filterValue="manager"
                    onClick={handlePermissionFilterClick}
                  />
                </Grid>
                <Grid>
                  <StatCard
                    title="Employees"
                    value={stats.employees}
                    icon={<PeopleIcon fontSize="large" />}
                    color="success"
                    filterValue="employee"
                    onClick={handlePermissionFilterClick}
                  />
                </Grid>
                <Grid>
                  <StatCard
                    title="Inactive"
                    value={stats.inactive}
                    icon={<LockIcon fontSize="large" />}
                    color="secondary"
                    filterValue={false}
                    onClick={handleStatusFilterClick}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Active Filters Display */}
            {(activePermissionFilter || activeStatusFilter !== null || searchTerm) && (
              <Box mb={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <FilterListIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Active filters:
                </Typography>
                {activePermissionFilter && (
                  <Chip
                    label={`Permission: ${activePermissionFilter}`}
                    size="small"
                    color={getPermissionColor(activePermissionFilter)}
                    onDelete={() => setActivePermissionFilter(null)}
                  />
                )}
                {activeStatusFilter !== null && (
                  <Chip
                    label={`Status: ${activeStatusFilter ? 'Active' : 'Inactive'}`}
                    size="small"
                    color={activeStatusFilter ? 'success' : 'secondary'}
                    onDelete={() => setActiveStatusFilter(null)}
                  />
                )}
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                  />
                )}
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearAllFilters}
                  variant="outlined"
                >
                  Clear All
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Search and View Controls */}
        <Grid container spacing={2} alignItems="center">
          <Grid>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                size="small"
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('cards')}
                size="small"
              >
                Card View
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee List View */}
      {/* Table View */}
      {viewMode === 'table' && (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={employees}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25]}
            loading={loading}
            disableSelectionOnClick
            sx={{ border: 0 }}
          />
        </Paper>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <Grid container spacing={3}>
          {employees.map((employee) => (
            <Grid key={employee.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={getGravatarUrl(employee.email, 50)}
                      sx={{ width: 50, height: 50, mr: 2 }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {employee.name} {employee.surname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.employeeNumber}
                      </Typography>
                      <Chip
                        label={employee.permissionLevel}
                        color={getPermissionColor(employee.permissionLevel)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Box mb={1}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <WorkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{employee.role}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{employee.email}</Typography>
                    </Box>
                    {canSeeSalary(employee) && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <SalaryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{`R${Number(employee.salary).toLocaleString()}`}</Typography>
                      </Box>
                    )}
                    {employee.manager && (
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Reports to: {employee.manager.name} {employee.manager.surname}
                        </Typography>
                      </Box>
                    )}
                    {isAdmin && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={employee.isActive}
                              onChange={() => handleToggleActive(employee)}
                              size="small"
                            />
                          }
                          label={employee.isActive ? 'Active' : 'Inactive'}
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  {canEditEmployee(employee) && (
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(employee)}
                    >
                      Edit
                    </Button>
                  )}
                  {canResetPassword(employee) && (
                    <Button
                      size="small"
                      startIcon={<LockIcon />}
                      color="warning"
                      onClick={() => setResetPasswordDialog({ open: true, employee })}
                    >
                      Reset Password
                    </Button>
                  )}
                  {canDeleteEmployee(employee) && (
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, employee })}
                    >
                      Delete
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <EditEmployeeDialog 
        editEmployee={editEmployee} 
        setEditEmployee={setEditEmployee}
        onNotification={onNotification}
        onRefresh={onRefresh}
      />
      
      <DeleteConfirmationDialog 
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDelete={handleDelete}
      />
      
      <ResetPasswordDialog 
        resetPasswordDialog={resetPasswordDialog}
        setResetPasswordDialog={setResetPasswordDialog}
        handleResetPassword={handleResetPassword}
      />
    </Box>
  );
};

// Dialog Components (keep the same as before)
const EditEmployeeDialog = ({ editEmployee, setEditEmployee, onNotification, onRefresh }) => (
  <Dialog
    open={!!editEmployee}
    onClose={() => setEditEmployee(null)}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>Edit Employee</DialogTitle>
    <DialogContent>
      {editEmployee && (
        <EmployeeForm
          employee={editEmployee}
          onSuccess={() => {
            onNotification('Employee updated successfully!');
            setEditEmployee(null);
            onRefresh();
          }}
          onError={(message) => onNotification(message, 'error')}
          onCancel={() => setEditEmployee(null)}
        />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setEditEmployee(null)}>Close</Button>
    </DialogActions>
  </Dialog>
);

const DeleteConfirmationDialog = ({ deleteDialog, setDeleteDialog, handleDelete }) => (
  <Dialog
    open={deleteDialog.open}
    onClose={() => setDeleteDialog({ open: false, employee: null })}
  >
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete {deleteDialog.employee?.name}{' '}
        {deleteDialog.employee?.surname}? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setDeleteDialog({ open: false, employee: null })}>
        Cancel
      </Button>
      <Button
        onClick={() => handleDelete(deleteDialog.employee)}
        color="error"
        variant="contained"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const ResetPasswordDialog = ({ resetPasswordDialog, setResetPasswordDialog, handleResetPassword }) => (
  <Dialog
    open={resetPasswordDialog.open}
    onClose={() => setResetPasswordDialog({ open: false, employee: null })}
  >
    <DialogTitle>Reset Password</DialogTitle>
    <DialogContent>
      <Typography>
        Reset password for {resetPasswordDialog.employee?.name} {resetPasswordDialog.employee?.surname}?
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        The password will be reset to: {resetPasswordDialog.employee?.name}{resetPasswordDialog.employee?.employeeNumber}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setResetPasswordDialog({ open: false, employee: null })}>
        Cancel
      </Button>
      <Button
        onClick={() => handleResetPassword(resetPasswordDialog.employee)}
        variant="contained"
        color="warning"
      >
        Reset Password
      </Button>
    </DialogActions>
  </Dialog>
);

export default EmployeeList;