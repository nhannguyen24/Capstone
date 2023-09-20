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

      Tour.belongsTo(models.Station, {
        foreignKey: "departureStationId",
        targetKey: 'stationId',
        as: "departure_station",
      });
      
      Tour.hasMany(models.Ticket, { as: 'tour_ticket', foreignKey: 'tourId'});
      
      Tour.belongsToMany(models.Bus, {
        through: 'Schedule',
        foreignKey: 'tourId',
        otherKey: 'busId',
        as: "tour_bus",
      });
      Tour.belongsToMany(models.User, {
        through: 'Schedule',
        foreignKey: 'tourId',
        otherKey: 'tourguildId',
        as: "tour_tourguild",
      });
      Tour.belongsToMany(models.User, {
        through: 'Schedule',
        foreignKey: 'tourId',
        otherKey: 'driverId',
        as: "tour_driver",
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
    note: DataTypes.STRING,
    beginBookingDate: DataTypes.DATEONLY,
    endBookingDate: DataTypes.DATEONLY,
    departureDate: DataTypes.DATEONLY,
    departureTime: DataTypes.TIME,
    endTime: DataTypes.TIME,
    routeId: {
      type: DataTypes.UUID
    },
    departureStationId: {
      type: DataTypes.UUID
    },
    tourStatus: {
      type: DataTypes.ENUM,
      values: ["NotStarted", "Ontour", "Canceled", "Finished"],
      validate: {
        isIn: {
          args: [["NotStarted", "Ontour", "Canceled", "Finished"]],
          msg: 'Invalid value for tour.status (NotStarted, Ontour, Canceled, Finished)'
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