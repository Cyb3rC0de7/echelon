'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      // Role has many users through UserRoles
      Role.belongsToMany(models.User, {
        through: models.UserRole,
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'users'
      });
    }
  }

  Role.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isIn: [['admin', 'hr_manager', 'manager', 'employee', 'viewer']]
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of permission strings'
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles'
  });

  return Role;
};