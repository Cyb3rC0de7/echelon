import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import { useDrop, useDrag } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { hierarchy, tree } from 'd3-hierarchy';
import { ZoomIn, ZoomOut, FitScreen, PanTool, Search, Clear } from '@mui/icons-material';
import md5 from 'blueimp-md5';
import { employeeApi, handleApiError } from '../services/api';
import { useAuth } from '../App';

// Custom wrapper to provide DnD context
const DndProviderWrapper = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

const EmployeeNode = ({ employee, onDrop, onSelect, position, scale, canDrag, canDrop }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'employee',
    item: { id: employee.id, name: employee.name, surname: employee.surname },
    canDrag: () => canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'employee',
    drop: (item) => canDrop && onDrop(item.id, employee.id),
    canDrop: () => canDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  }));

  const getGravatarUrl = (email, size = 40) => {
    if (!email) return `https://www.gravatar.com/avatar/?s=${size}&d=identicon`;
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  };

  return (
    <Box
      ref={(node) => {
        if (canDrag) drag(node);
        if (canDrop) drop(node);
      }}
      sx={{
        position: 'absolute',
        left: position.x - 90,
        top: position.y - 30,
        opacity: isDragging ? 0.5 : 1,
        border: isOver ? '2px dashed #1976d2' : '2px solid #e0e0e0',
        borderRadius: 2,
        p: 1.5,
        bgcolor: 'background.paper',
        minWidth: 180,
        cursor: canDrag ? 'move' : 'pointer',
        transform: `scale(${isDragging ? 0.95 : 1})`,
        transition: 'all 0.2s ease',
        zIndex: isOver ? 10 : 1,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          borderColor: '#1976d2',
        },
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(employee);
      }}
    >
      <Box display="flex" alignItems="center">
        <Avatar
          src={getGravatarUrl(employee.email, 32)}
          sx={{ width: 32, height: 32, mr: 2, bgcolor: '#1976d2' }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {employee.name} {employee.surname}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            {employee.role}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const HierarchyView = ({ refreshTrigger, onNotification }) => {
  const { user } = useAuth();
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const fitToScreenButtonRef = useRef(null);

  // Permission checks
  const isAdmin = user?.permissionLevel === 'admin';
  const isHR = user?.permissionLevel === 'hr';
  const isManager = user?.permissionLevel === 'manager';

  // Check if user can see salary
  const canSeeSalary = (employee) => {
    return isAdmin || isHR || employee.id === user?.id;
  };

  // Check if user can drag employees (change their manager)
  const canDragEmployee = (employee) => {
    if (isAdmin || isHR) return true;
    if (isManager && employee.manager?.id === user?.id) return true;
    return false;
  };

  // Check if user can accept drops (become a manager)
  const canDropOnEmployee = (employee) => {
    if (isAdmin || isHR) return true;
    if (isManager) return true;
    return false;
  };

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getHierarchy();
      setHierarchyData(response.data);
      processTreeData(response.data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      onNotification(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const processTreeData = useCallback((data) => {
    if (!data || data.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    try {
      const root = hierarchy(data[0]);
      
      const treeLayout = tree()
        .nodeSize([200, 150])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

      const treeData = treeLayout(root);
      
      const nodes = treeData.descendants();
      const links = treeData.links();
      
      setNodes(nodes);
      setLinks(links);
    } catch (error) {
      console.error('Error processing tree data:', error);
      setNodes([]);
      setLinks([]);
    }
  }, []);

  const handleWheel = useCallback((e) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, scale * delta));
    
    const factor = newScale / scale;
    const newOffsetX = mouseX - (mouseX - offset.x) * factor;
    const newOffsetY = mouseY - (mouseY - offset.y) * factor;
    
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [scale, offset]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    
    if (e.target === containerRef.current || e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - offset.x, 
        y: e.clientY - offset.y 
      });
      e.preventDefault();
    }
  }, [offset]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleWheel, handleMouseDown]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDrop = async (draggedId, targetId) => {
    if (draggedId === targetId) {
      setSnackbar({ open: true, message: 'Cannot assign self as manager' });
      return;
    }

    // Find the dragged employee to check permissions
    const draggedEmployee = nodes.find(node => node.data.id === draggedId)?.data;
    if (!draggedEmployee || !canDragEmployee(draggedEmployee)) {
      setSnackbar({ open: true, message: 'You do not have permission to move this employee' });
      return;
    }

    try {
      await employeeApi.updateManager(draggedId, targetId);
      setSnackbar({ open: true, message: 'Manager updated successfully!' });
      fetchHierarchy();
    } catch (error) {
      onNotification(handleApiError(error), 'error');
    }
  };

  const handleSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleFitToScreen = useCallback(() => {
    setScale(1);
    setOffset({ x: 400, y: 100 });
  }, []);

  // Search functionality
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results = nodes.filter(node => {
      const employee = node.data;
      const fullName = `${employee.name} ${employee.surname}`.toLowerCase();
      const email = employee.email?.toLowerCase() || '';
      const role = employee.role?.toLowerCase() || '';
      const employeeNumber = employee.employeeNumber?.toLowerCase() || '';
      
      return fullName.includes(term) || 
             email.includes(term) || 
             role.includes(term) ||
             employeeNumber.includes(term);
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentSearchIndex(newIndex);
    centerOnEmployee(searchResults[newIndex]);
  };

  const centerOnEmployee = (node) => {
    if (!node) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    // Calculate the offset needed to center the employee
    const targetX = containerCenterX - (node.x * scale);
    const targetY = containerCenterY - (node.y * scale);

    setOffset({ x: targetX, y: targetY });
    setSelectedEmployee(node.data);

    // Highlight the node temporarily
    const employeeNode = document.querySelector(`[data-employee-id="${node.data.id}"]`);
    if (employeeNode) {
      employeeNode.style.boxShadow = '0 0 0 3px #ff5722';
      employeeNode.style.zIndex = '100';
      setTimeout(() => {
        if (employeeNode) {
          employeeNode.style.boxShadow = '';
          employeeNode.style.zIndex = '';
        }
      }, 2000);
    }
  };

  // Auto-fit to screen on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loading, handleFitToScreen]);

  useEffect(() => {
    fetchHierarchy();
  }, [refreshTrigger]);

  // Auto-center on search result when index changes
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
      centerOnEmployee(searchResults[currentSearchIndex]);
    }
  }, [currentSearchIndex]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} sx={{ height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hierarchyData.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No employees found. Add some employees to see the hierarchy.
      </Alert>
    );
  }

  return (
    <DndProviderWrapper>
      <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Organization Hierarchy
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Button onClick={handleZoomOut} size="small" variant="outlined">
              <ZoomOut />
            </Button>

            <Button 
              onClick={handleFitToScreen} 
              size="small" 
              variant="outlined"
              ref={fitToScreenButtonRef}
            >
              <FitScreen />
            </Button>

            <Button onClick={handleZoomIn} size="small" variant="outlined">
              <ZoomIn />
            </Button>
            <Typography variant="caption" sx={{ ml: 2 }}>
              Zoom: {Math.round(scale * 100)}%
            </Typography>
          </Box>
        </Box>
        
        {/* Search Bar */}
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search employees by name, email, role, or employee number..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          {searchResults.length > 0 && (
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Typography variant="body2" color="text.secondary">
                {currentSearchIndex + 1} of {searchResults.length} results
              </Typography>

              <Button
                size="small"
                onClick={() => navigateSearchResults('prev')}
                disabled={searchResults.length <= 1}
              >
                Previous
              </Button>

              <Button
                size="small"
                onClick={() => navigateSearchResults('next')}
                disabled={searchResults.length <= 1}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {(isAdmin || isHR || isManager) && 'Drag employees to change their manager. '}
          Scroll to zoom, click and drag to pan.
        </Typography>

        {/* Main Content */}
        <Box display="flex" gap={2} sx={{ flex: 1, minHeight: 0}}>
          {/* Tree Visualization */}
          <Paper 
            sx={{ 
              width: '80%',
              display: 'flex',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: '#f8f9fa',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* SVG for lines */}
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                  {links.map((link, index) => (
                    <line
                      key={index}
                      x1={link.source.x}
                      y1={link.source.y}
                      x2={link.target.x}
                      y2={link.target.y}
                      stroke="#1976d2"
                      strokeWidth={2}
                      opacity={0.6}
                    />
                  ))}
                </g>
              </svg>

              {/* Employee Nodes */}
              <Box
                sx={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  position: 'relative',
                  width: 0,
                  height: 0
                }}
              >
                {nodes.map((node) => (
                  <EmployeeNode
                    key={node.data.id}
                    employee={node.data}
                    onDrop={handleDrop}
                    onSelect={handleSelect}
                    position={{ x: node.x, y: node.y }}
                    scale={scale}
                    canDrag={canDragEmployee(node.data)}
                    canDrop={canDropOnEmployee(node.data)}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Employee Details Panel */}
          <Paper sx={{ width: 350, p: 2, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Employee Details
            </Typography>
            {selectedEmployee ? (
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={(() => {
                        if (!selectedEmployee.email) return `https://www.gravatar.com/avatar/?s=60&d=identicon`;
                        const hash = md5(selectedEmployee.email.trim().toLowerCase());
                        return `https://www.gravatar.com/avatar/${hash}?s=60&d=identicon`;
                      })()}
                      sx={{ width: 60, height: 60, mr: 2, bgcolor: '#1976d2' }}
                    />
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

                  {selectedEmployee.birthDate && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Birth Date:</strong>{' '}
                      {new Date(selectedEmployee.birthDate).toLocaleDateString()}
                    </Typography>
                  )}

                  {canSeeSalary(selectedEmployee) && selectedEmployee.salary && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Salary:</strong> R
                      {Number(selectedEmployee.salary).toLocaleString()}
                    </Typography>
                  )}

                  {selectedEmployee.manager && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Manager:</strong> {selectedEmployee.manager.name}{' '}
                      {selectedEmployee.manager.surname}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" component="span">
                      <strong>Permission Level:</strong>
                    </Typography>
                    <Chip 
                      label={selectedEmployee.permissionLevel} 
                      size="small" 
                      color={
                        selectedEmployee.permissionLevel === 'admin' ? 'error' :
                        selectedEmployee.permissionLevel === 'hr' ? 'warning' :
                        selectedEmployee.permissionLevel === 'manager' ? 'info' : 'default'
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Click on an employee to view details
              </Typography>
            )}
          </Paper>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </DndProviderWrapper>
  );
};

export default HierarchyView;