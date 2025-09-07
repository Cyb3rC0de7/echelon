const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { Op } = require('sequelize');

// All admin routes require admin permission
router.use(authenticateToken);
router.use(requirePermission(['admin']));

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Employee.findAll({
      attributes: [
        'permissionLevel',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['permissionLevel']
    });

    const activeCount = await Employee.count({ where: { isActive: true } });
    const inactiveCount = await Employee.count({ where: { isActive: false } });
    const totalCount = await Employee.count();

    const recentEmployees = await Employee.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['name', 'surname', 'role', 'createdAt']
    });

    res.json({
      permissionBreakdown: stats,
      activeEmployees: activeCount,
      inactiveEmployees: inactiveCount,
      totalEmployees: totalCount,
      recentEmployees
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk permission updates
router.put('/bulk-permissions', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, permissionLevel }
    
    for (const update of updates) {
      await Employee.update(
        { permissionLevel: update.permissionLevel },
        { where: { id: update.id } }
      );
    }

    res.json({ message: 'Permissions updated successfully', count: updates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export employee data
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const employees = await Employee.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Employee, as: 'manager', attributes: ['name', 'surname'] }
      ]
    });

    if (format === 'json') {
      res.json(employees);
    } else if (format === 'csv') {
      // Simple CSV export
      const csv = employees.map(emp => 
        `${emp.employeeNumber},${emp.name},${emp.surname},${emp.email},${emp.role},${emp.permissionLevel},${emp.manager ? emp.manager.name + ' ' + emp.manager.surname : 'No Manager'}`
      ).join('\n');
      
      const header = 'Employee Number,Name,Surname,Email,Role,Permission Level,Manager\n';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      res.send(header + csv);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await Employee.sequelize.authenticate();
    const employeeCount = await Employee.count();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      totalEmployees: employeeCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;