'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Role.hasMany(models.User, { as: 'role_user', foreignKey: 'roleId'});
    }
  }
  Role.init({
    roleId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleName: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ['Active', 'Deactive'],
      validate: {
        isIn: {
          args: [['Active', 'Deactive']],
          msg: 'Invalid value for role.status (Active, Deactive)'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Role',
  });
  Role.beforeCreate((role, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    role.createdAt = currentDate;
    role.updatedAt = currentDate;
  });
  return Role;
};