'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: "roleId",
        targetKey: 'roleId',
        as: "user_role",
      });
      User.hasMany(models.Ticket, { as: 'user_ticket', foreignKey: 'userId'});
      User.hasMany(models.Booking, { as: 'user_booking', foreignKey: 'userId'});

      User.belongsToMany(models.Bus, {
        through: 'Schedule',
        foreignKey: 'userId',
        otherKey: 'busId',
        as: "user_bus",
      });
      User.belongsToMany(models.Tour, {
        through: 'Schedule',
        foreignKey: 'userId',
        otherKey: 'tourId',
        as: "user_tour",
      });
      User.belongsToMany(models.User, {
        through: 'Schedule',
        foreignKey: 'userId',
        otherKey: 'tourguildId',
        as: "tourguild_driver",
      });
      User.belongsToMany(models.User, {
        through: 'Schedule',
        foreignKey: 'userId',
        otherKey: 'driverId',
        as: "driver_tourguild",
      });
    }
  }
  User.init({
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userName: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    birthday: DataTypes.DATEONLY,
    avatar: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING(10),
    roleId: {
      type: DataTypes.UUID
    },
    refreshToken: DataTypes.STRING,
    accessChangePassword: DataTypes.BOOLEAN,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for user.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate((user, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    user.createdAt = currentDate;
    user.updatedAt = currentDate;
  });

  User.beforeUpdate((user, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    user.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return User;
};