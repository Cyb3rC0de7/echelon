// server/models/Employee.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  managerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'employees',
      key: 'id'
    },
    allowNull: true
  }
}, {
  tableName: 'employees',
  timestamps: true
});

// Self-referencing relationship for manager
Employee.belongsTo(Employee, { 
  as: 'manager', 
  foreignKey: 'managerId' 
});

Employee.hasMany(Employee, { 
  as: 'subordinates', 
  foreignKey: 'managerId' 
});

// Validation to prevent self-management
Employee.addHook('beforeSave', (employee) => {
  if (employee.managerId && employee.managerId === employee.id) {
    throw new Error('Employee cannot be their own manager');
  }
});

module.exports = Employee;