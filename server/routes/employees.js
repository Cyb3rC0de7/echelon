const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');
const { authenticateToken, requirePermission, canAccessEmployee } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/employees - Get all employees with optional search and filters and permission filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, role, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    
    let whereClause = {};
    
    // Apply permission-based filtering
    if (req.user.permissionLevel === 'employee') {
      // Employees can only see themselves and their manager chain
      whereClause.id = req.user.id;
    } else if (req.user.permissionLevel === 'manager') {
      // Managers see their subordinates + themselves
      const subordinateIds = req.user.subordinates?.map(s => s.id) || [];
      whereClause.id = { [Op.in]: [...subordinateIds, req.user.id] };
    }
    // HR and Admin see everyone (no additional where clause)
    
    // Add search functionality
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.and]: [
          whereClause,
          {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { surname: { [Op.iLike]: `%${search}%` } },
              { employeeNumber: { [Op.iLike]: `%${search}%` } },
              { role: { [Op.iLike]: `%${search}%` } }
            ]
          }
        ]
      };
    }
    
    const employees = await Employee.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'role'] },
        { model: Employee, as: 'subordinates', attributes: ['id', 'name', 'surname', 'role'] }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]]
    });
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/:id - Get single employee
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { 
          model: Employee, 
          as: 'manager', 
          attributes: ['id', 'name', 'surname', 'role']
        },
        { 
          model: Employee, 
          as: 'subordinates', 
          attributes: ['id', 'name', 'surname', 'role']
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees - Create new employee
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { employeeNumber, name, surname, email, birthDate, salary, role, managerId } = req.body;
    
    // Validate required fields
    if (!employeeNumber || !name || !surname || !email || !birthDate || !salary || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Check if manager exists (if provided)
    if (managerId) {
      const manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }
    
    const employee = await Employee.create({
      employeeNumber,
      name,
      surname,
      email,
      birthDate,
      salary,
      role,
      managerId: managerId || null
    });
    
    // Fetch the created employee with relations
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'role'] }
      ]
    });
    
    res.status(201).json(createdEmployee);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Employee number or email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const { employeeNumber, name, surname, email, birthDate, salary, role, permissionLevel, isActive, managerId } = req.body;
    
    const { canAccessEmployee } = require('../middleware/auth');
    if (!canAccessEmployee(req.user, employee.id)) {
      return res.status(403).json({ error: 'Insufficient permissions to update this employee' });
    }

    // Check if manager exists and is not the employee themselves
    if (managerId) {
      if (managerId == req.params.id) {
        return res.status(400).json({ error: 'Employee cannot be their own manager' });
      }
      
      const manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }
    
    await employee.update({
      employeeNumber: employeeNumber || employee.employeeNumber,
      name: name || employee.name,
      surname: surname || employee.surname,
      email: email || employee.email,
      birthDate: birthDate || employee.birthDate,
      salary: salary !== undefined ? salary : employee.salary,
      role: role || employee.role,
      permissionLevel: permissionLevel || employee.permissionLevel,
      isActive: isActive || employee.isActive,
      managerId: managerId !== undefined ? managerId : employee.managerId
    });
    
    // Fetch updated employee with relations
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'role'] },
        { model: Employee, as: 'subordinates', attributes: ['id', 'name', 'surname', 'role'] }
      ]
    });
    
    res.json(updatedEmployee);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Employee number or email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/employees/:id/manager - Update employee's manager
router.put('/:id/manager', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    const { managerId } = req.body;

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Check if manager exists and is not the employee themselves
    if (managerId) {
      if (managerId == req.params.id) {
        return res.status(400).json({ error: 'Employee cannot be their own manager' });
      }
      const manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }

    await employee.update({ managerId: managerId || null });
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'role'] },
        { model: Employee, as: 'subordinates', attributes: ['id', 'name', 'surname', 'role'] }
      ]
    });
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if employee has subordinates
    const subordinates = await Employee.findAll({ where: { managerId: req.params.id } });
    if (subordinates.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete employee with subordinates. Please reassign subordinates first.' 
      });
    }
    
    await employee.destroy();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/hierarchy - Get full organization hierarchy
router.get('/hierarchy/tree', authenticateToken, async (req, res) => {
  try {
    // Get all employees
    const employees = await Employee.findAll({
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname'] },
        { model: Employee, as: 'subordinates', attributes: ['id', 'name', 'surname'] }
      ]
    });
    
    // Build hierarchy tree
    const buildHierarchy = (managerId = null) => {
      return employees
        .filter(emp => emp.managerId === managerId)
        .map(emp => ({
          ...emp.toJSON(),
          children: buildHierarchy(emp.id)
        }));
    };
    
    const hierarchy = buildHierarchy();
    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;