'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Schedule.belongsTo(models.Bus, {
        foreignKey: 'busId',
        as: 'schedule_bus'
      });
      
      Schedule.belongsTo(models.Tour, {
        foreignKey: 'tourId',
        as: 'schedule_tour'
      });

      Schedule.belongsTo(models.User, {
        foreignKey: 'tourguildId',
        as: 'schedule_tourguild'
      });
      
      Schedule.belongsTo(models.User, {
        foreignKey: 'driverId',
        as: 'schedule_driver'
      });
    }
  }
  Schedule.init({
    scheduleId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    busId: {
      type: DataTypes.UUID
    },
    tourId: {
      type: DataTypes.UUID
    },
    tourGuildId: {
      type: DataTypes.UUID
    },
    driverId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for schedule.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Schedule',
  });
  Schedule.beforeCreate((tourDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tourDetail.createdAt = currentDate;
    tourDetail.updatedAt = currentDate;
  });

  Schedule.beforeUpdate((tourDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tourDetail.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Schedule;
};