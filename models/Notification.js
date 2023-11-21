'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notification.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: 'userId',
        as: "noti_user",
      });
    }
  }
  Notification.init({
    notiId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: DataTypes.STRING,
    body: DataTypes.STRING,
    deviceToken: DataTypes.STRING,
    notiType: DataTypes.STRING,
    userId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for notification.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Notification',
  });
  Notification.beforeCreate((notification, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    notification.createdAt = currentDate;
    notification.updatedAt = currentDate;
  });

  Notification.beforeUpdate((notification, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    notification.setDataValue('updatedAt', currentDate);
  });
  return Notification;
};