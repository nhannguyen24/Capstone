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
      Schedule.belongsTo(models.Tour, {
        foreignKey: "tourId",
        targetKey: 'tourId',
        as: "schedule_tour",
      });
      
      Schedule.belongsTo(models.Bus, {
        foreignKey: 'busId',
        as: 'schedule_bus'
      });
      
      Schedule.belongsTo(models.User, {
        foreignKey: 'tourGuideId',
        as: 'schedule_tourguide'
      });
      
      Schedule.belongsTo(models.User, {
        foreignKey: 'driverId',
        as: 'schedule_driver'
      });

      Schedule.hasMany(models.Booking, { as: 'schedule_booking', foreignKey: 'scheduleId'});
      Schedule.hasMany(models.Tracking, { as: 'schedule_tracking', foreignKey: 'scheduleId'});
      Schedule.hasMany(models.Booking, { as: 'schedule_booking', foreignKey: 'scheduleId'});
    }
  }
  Schedule.init({
    scheduleId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    departureDate: DataTypes.DATE,
    endDate: DataTypes.TIME,
    departureStation: DataTypes.STRING,
    isScheduled: DataTypes.BOOLEAN,
    tourId: {
      type: DataTypes.UUID
    },
    tourGuideId: {
      type: DataTypes.UUID
    },
    driverId: {
      type: DataTypes.UUID
    },
    busId: {
      type: DataTypes.UUID
    },
    scheduleStatus: {
      type: DataTypes.ENUM,
      values: ["Available", "Started", "Canceled", "Finished"],
      validate: {
        isIn: {
          args: [["Available", "Started", "Canceled", "Finished"]],
          msg: 'Invalid value for schedule.status (Available, Started, Canceled, Finished)'
        }
      }
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
  Schedule.beforeCreate((schedule, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    schedule.createdAt = currentDate;
    schedule.updatedAt = currentDate;
  });

  Schedule.beforeUpdate((schedule, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    schedule.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Schedule;
};