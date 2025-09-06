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
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  AttachMoney as SalaryIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import md5 from 'blueimp-md5'; //browser safe
import { employeeApi, handleApiError } from '../services/api';
import EmployeeForm from './EmployeeForm';

const EmployeeList = ({ refreshTrigger, onNotification, onRefresh }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [viewMode, setViewMode] = useState('table'); //'table' or 'cards'

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll({ search: searchTerm });
      setEmployees(response.data);
    } catch (error) {
      onNotification(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger, searchTerm]);

  const handleEdit = (employee) => setEditEmployee(employee);

  const handleDelete = async (employee) => {
    const prevEmployees = [...employees];
    setEmployees((curr) => curr.filter((e) => e.id !== employee.id)); //optimistic update

    try {
      await employeeApi.delete(employee.id);
      onNotification('Employee deleted successfully');
      onRefresh();
      setDeleteDialog({ open: false, employee: null });
    } catch (error) {
      setEmployees(prevEmployees); //rollback
      onNotification(handleApiError(error), 'error');
    }
  };

  const getGravatarUrl = (email, size = 40) => {
    if (!email) return `https://www.gravatar.com/avatar/?s=${size}&d=identicon`;
    const hash = md5(email.trim().toLowerCase());
    //const hash = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex'); // Doesn't work in browser
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

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
  {
    field: 'salary',
    headerName: 'Salary',
    width: 120,
    valueFormatter: (params) => `R${Number(params).toLocaleString()}`,
  },
  {
    field: 'manager',
    headerName: 'Manager',
    width: 180,
    valueGetter: (value, row) =>
      row?.manager ? `${row.manager.name} ${row.manager.surname}` : 'No Manager',
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    renderCell: (params) => (
      <Box>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => setDeleteDialog({ open: true, employee: params.row })}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    sortable: false,
    filterable: false,
  },
  ];


  return (
    <Box>
      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
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
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              sx={{ mr: 1 }}
            >
              Table View
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
            >
              Card View
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <SalaryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{`R${Number(employee.salary).toLocaleString()}`}</Typography>
                    </Box>
                    {employee.manager && (
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Reports to: {employee.manager.name} {employee.manager.surname}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(employee)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, employee })}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Employee Dialog */}
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
              onCancel={() => setEditEmployee(null)} //cancel without reload
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmployee(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
    </Box>
  );
};

export default EmployeeList;