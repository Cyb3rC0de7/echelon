import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Card, 
  CardContent, 
  Box 
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('API connection failed'));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Echelon - Employee Hierarchy Manager
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Welcome to Echelon
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Employee hierarchy management system
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                API Status: {apiStatus}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default App;