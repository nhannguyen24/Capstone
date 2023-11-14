'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tour extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Tour.belongsTo(models.Route, {
        foreignKey: "routeId",
        targetKey: 'routeId',
        as: "tour_route",
      });
      
      Tour.hasMany(models.Ticket, { as: 'tour_ticket', foreignKey: 'tourId'});
      Tour.hasOne(models.Report, { as: 'tour_report', foreignKey: 'tourId'});
      
      Tour.belongsTo(models.Bus, {
        foreignKey: 'busId',
        as: 'tour_bus'
      });
      
      Tour.belongsTo(models.User, {
        foreignKey: 'tourGuideId',
        as: 'tour_tourguide'
      });
      
      Tour.belongsTo(models.User, {
        foreignKey: 'driverId',
        as: 'tour_driver'
      });
      
      Tour.hasMany(models.Image, { as: 'tour_image', foreignKey: 'tourId'});
    }
  }
  Tour.init({
    tourId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tourName: DataTypes.STRING,
    description: DataTypes.STRING,
    beginBookingDate: DataTypes.DATE,
    endBookingDate: DataTypes.DATE,
    departureDate: DataTypes.DATE,
    duration: DataTypes.TIME,
    isScheduled: DataTypes.BOOLEAN,
    routeId: {
      type: DataTypes.UUID
    },
    departureStationId: DataTypes.STRING,
    tourGuideId: {
      type: DataTypes.UUID
    },
    driverId: {
      type: DataTypes.UUID
    },
    busId: {
      type: DataTypes.UUID
    },
    tourStatus: {
      type: DataTypes.ENUM,
      values: ["Available", "Started", "Canceled", "Finished"],
      validate: {
        isIn: {
          args: [["Available", "Started", "Canceled", "Finished"]],
          msg: 'Invalid value for tour.status (Available, Started, Canceled, Finished)'
        }
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for tour.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Tour',
  });
  Tour.beforeCreate((tour, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tour.createdAt = currentDate;
    tour.updatedAt = currentDate;
  });

  Tour.beforeUpdate((tour, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tour.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Tour;
};