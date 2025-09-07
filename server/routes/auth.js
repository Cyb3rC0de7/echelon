const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const Employee = require('../models/Employee');
const router = express.Router();

// POST api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await Employee.findOne({
      where: { email: email, isActive: true }
    });

    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await employee.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        employeeId: employee.id, 
        permissionLevel: employee.permissionLevel,
        email: employee.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...employeeWithoutPassword } = employee.toJSON();
    
    res.json({
      token,
      user: employeeWithoutPassword,
      expiresIn: '24h'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const employee = await Employee.findByPk(req.user.id);
    
    // Verify current password
    const isValidPassword = await employee.checkPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await employee.update({
      password: newPassword, // Will be hashed by beforeUpdate hook
      requiresPasswordReset: false
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password to default (admin only)
router.put('/reset-password/:employeeId', authenticateToken, async (req, res) => {
  try {
    if (req.user.permissionLevel !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const employee = await Employee.findByPk(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const defaultPassword = `${employee.name}${employee.employeeNumber}`;
    
    await employee.update({
      password: defaultPassword, // Will be hashed by beforeUpdate hook
      requiresPasswordReset: true
    });

    res.json({ 
      message: 'Password reset successfully',
      defaultPassword: defaultPassword // Send back so admin can inform user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Employee, as: 'manager', attributes: ['id', 'name', 'surname', 'email'] }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ user: employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;