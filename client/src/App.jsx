import React, { useState, useEffect, createContext, useContext } from 'react';
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
  Snackbar,
  Button,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Logout } from '@mui/icons-material';

import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import HierarchyView from './components/HierarchyView';
import Login from './components/Login';
import { authApi } from './services/api';

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

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          await authApi.getMe();
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore error, just clear local data
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

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

// Authenticated App Component
const AuthenticatedApp = () => {
  const { user, logout } = useAuth();
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Echelon - Employee Hierarchy Manager
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username} ({user?.role})
          </Typography>
          <Button 
            color="inherit" 
            onClick={logout} 
            startIcon={<Logout />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ width: '100%', maxWidth: 'none' }}>
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
  );
};

// Main App Content Router
const AppContent = () => {
  const { user, login, loading } = useAuth();

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={login} />
      </ThemeProvider>
    );
  }

  return <AuthenticatedApp />;
};

// Main App Component with Providers
function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App;