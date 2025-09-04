'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // User has many roles through UserRoles
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'roles'
      });
      
      // User has one employee record
      User.hasOne(models.Employee, {
        foreignKey: 'userId',
        as: 'employee'
      });
    }

    // Instance methods
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    async hasRole(roleName) {
      const roles = await this.getRoles();
      return roles.some(role => role.name === roleName);
    }

    async hasPermission(permission) {
      const roles = await this.getRoles();
      return roles.some(role => 
        role.permissions && role.permissions.includes(permission)
      );
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
        }
      }
    }
  });

  return User;
};