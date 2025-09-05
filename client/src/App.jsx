import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import HierarchyView from './components/HierarchyView';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Test API connection on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('API Status:', data.message);
      })
      .catch(error => {
        console.error('API connection failed:', error);
        showNotification('Failed to connect to API', 'error');
      });
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Echelon - Employee Hierarchy Manager
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl">
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label="Employee List" />
              <Tab label="Add Employee" />
              <Tab label="Hierarchy View" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <EmployeeList 
              refreshTrigger={refreshTrigger}
              onNotification={showNotification}
              onRefresh={triggerRefresh}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <EmployeeForm 
              onSuccess={() => {
                showNotification('Employee created successfully!');
                triggerRefresh();
                setCurrentTab(0); // Switch back to list
              }}
              onError={(message) => showNotification(message, 'error')}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <HierarchyView 
              refreshTrigger={refreshTrigger}
              onNotification={showNotification}
            />
          </TabPanel>
        </Container>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;