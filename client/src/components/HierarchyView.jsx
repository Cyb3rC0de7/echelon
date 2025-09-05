import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { ExpandMore, ChevronRight, Person } from '@mui/icons-material';
import { employeeApi, handleApiError } from '../services/api';

const HierarchyView = ({ refreshTrigger, onNotification }) => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expanded, setExpanded] = useState([]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getHierarchy();
      setHierarchy(response.data);
      
      // Expand all nodes by default
      const allIds = getAllIds(response.data);
      setExpanded(allIds);
    } catch (error) {
      onNotification(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [refreshTrigger]);

  const getGravatarUrl = (email, size = 40) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&size=${size}`;
  };

  const getAllIds = (employees) => {
    const ids = [];
    const collect = (emp) => {
      ids.push(emp.id.toString());
      if (emp.children) {
        emp.children.forEach(collect);
      }
    };
    employees.forEach(collect);
    return ids;
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const renderTreeItem = (employee) => (
    <TreeItem
      key={employee.id}
      itemId={employee.id.toString()}
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1,
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
          onClick={(e) => {
            e.stopPropagation(); //prevent expand collapse click
            setSelectedEmployee(employee);
          }}
        >
          <Avatar
            src={getGravatarUrl(employee.email, 32)}
            sx={{ width: 32, height: 32, mr: 2 }}
          >
            <Person fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle2">
              {employee.name} {employee.surname}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.role}
            </Typography>
          </Box>
        </Box>
      }
    >
      {employee.children &&
        employee.children.length > 0 &&
        employee.children.map((child) => renderTreeItem(child))}
    </TreeItem>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <Alert severity="info">
        No employees found. Add some employees to see the hierarchy.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Organization Hierarchy
      </Typography>

      <Box display="flex" gap={3}>
        {/* Hierarchy Tree */}
        <Paper sx={{ flex: 1, p: 2, maxHeight: '70vh', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Hierarchy Tree
          </Typography>
          <SimpleTreeView
            expanded={expanded}
            onNodeToggle={handleToggle}
            defaultCollapseIcon={<ExpandMore />}
            defaultExpandIcon={<ChevronRight />}
          >
            {hierarchy.map((employee) => renderTreeItem(employee))}
          </SimpleTreeView>
        </Paper>

        {/* Employee Details */}
        {selectedEmployee && (
          <Paper sx={{ width: 300, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Employee Details
            </Typography>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={getGravatarUrl(selectedEmployee.email, 60)}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedEmployee.name} {selectedEmployee.surname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.employeeNumber}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Chip
                    label={selectedEmployee.role}
                    color="primary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {selectedEmployee.email}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Birth Date:</strong>{' '}
                  {new Date(selectedEmployee.birthDate).toLocaleDateString()}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Salary:</strong> $
                  {Number(selectedEmployee.salary).toLocaleString()}
                </Typography>

                {selectedEmployee.manager && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Manager:</strong> {selectedEmployee.manager.name}{' '}
                    {selectedEmployee.manager.surname}
                  </Typography>
                )}

                {selectedEmployee.subordinates &&
                  selectedEmployee.subordinates.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom>
                        <strong>
                          Direct Reports ({selectedEmployee.subordinates.length}
                          ):
                        </strong>
                      </Typography>
                      {selectedEmployee.subordinates.map((sub) => (
                        <Chip
                          key={sub.id}
                          label={`${sub.name} ${sub.surname}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
              </CardContent>
            </Card>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default HierarchyView;