'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class Employee extends Model {
    static associate(models) {
      // Employee belongs to User
      Employee.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Self-referencing for manager hierarchy
      Employee.belongsTo(Employee, {
        foreignKey: 'managerId',
        as: 'manager'
      });
      
      Employee.hasMany(Employee, {
        foreignKey: 'managerId',
        as: 'directReports'
      });
    }

    // Generate Gravatar URL
    getGravatarUrl(size = 200) {
      const email = this.gravatarEmail || this.user?.email || '';
      const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
    }

    // Get full name
    get fullName() {
      return `${this.user?.firstName} ${this.user?.lastName}`;
    }

    // Check if employee can manage another employee
    async canManage(targetEmployeeId) {
      // Implementation for checking management hierarchy
      // This would recursively check if this employee is a manager of the target
      return false; // Placeholder
    }
  }

  Employee.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 20]
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
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      },
      validate: {
        notSelfManager(value) {
          if (value === this.id) {
            throw new Error('Employee cannot be their own manager');
          }
        }
      }
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    gravatarEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees'
  });

  return Employee;
};