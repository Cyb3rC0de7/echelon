const jwt = require('jsonwebtoken');
const Employee = require('../models/employee');

const JWT_SECRET = process.env.JWT_SECRET || '6f4c11a010f4bef58eb456b32622449632567a5ce265c2b73f44682d0c695b1f450afc8b86cf64680e3a4a06295b84f3248c899a4a1e919f67b6e1a7efda322c';

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