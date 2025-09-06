const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const employee = await Employee.findByPk(decoded.employeeId, {
      attributes: { exclude: ['password'] },
      include: [
        {model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'email']},
        {model: Employee, as: 'subordinates', attributes: ['id', 'name', 'surname', 'email']}
      ]
    });

    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive employee' });
    }

    req.user = employee;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requirePermission = (levels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!levels.includes(req.user.permissionLevel)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const canAccessEmployee = (currentUser, targetEmployeeId) => {
  // Admin and HR can access anyone
  if (['admin', 'hr'].includes(currentUser.permissionLevel)) {
    return true;
  }

  // Can access self
  if (currentUser.id === targetEmployeeId) {
    return true;
  }

  // Managers can access their subordinates
  if (currentUser.permissionLevel === 'manager') {
    return currentUser.subordinates?.some(sub => sub.id === targetEmployeeId) || false;
  }

  return false;
};

module.exports = { authenticateToken, requirePermission, canAccessEmployee, JWT_SECRET };