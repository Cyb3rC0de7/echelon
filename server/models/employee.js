// server/models/Employee.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

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
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => generateDefaultPassword(),
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  requiresPasswordReset: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // New employees must reset password on first login
  },
  permissionLevel: {
    type: DataTypes.ENUM('employee', 'manager', 'hr', 'admin'),
    defaultValue: 'employee'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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

Employee.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const generateDefaultPassword = () => {
  return 'TempPass123!';
}

// Validation to prevent self-management
Employee.addHook('beforeSave', (employee) => {
  if (employee.managerId && employee.managerId === employee.id) {
    throw new Error('Employee cannot be their own manager');
  }
});

// Hash password before saving
Employee.addHook('beforeCreate', async (employee) => {
  // Generate default password if none provided
  if (!employee.password || employee.password === 'TempPass123!') {
    const defaultPassword = `${employee.name}${employee.employeeNumber}`;
    employee.password = await bcrypt.hash(defaultPassword, 12);
    employee.requiresPasswordReset = true;
  } else {
    // If password was explicitly set, hash it
    employee.password = await bcrypt.hash(employee.password, 12);
  }
});

Employee.addHook('beforeUpdate', async (employee) => {
  if (employee.changed('password')) {
    employee.password = await bcrypt.hash(employee.password, 12);
  }
});

module.exports = Employee;