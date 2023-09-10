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
        foreignKey: "depatureStationId",
        targetKey: 'stationId',
        as: "tour_station",
      });
      Tour.hasMany(models.Ticket, { as: 'tour_ticket', foreignKey: 'tourId'});
      
      Tour.belongsToMany(models.Bus, {
        through: 'TourDetail',
        foreignKey: 'tourId',
        otherKey: 'busId',
        as: "tour_bus",
      });
      Tour.belongsToMany(models.User, {
        through: 'TourDetail',
        foreignKey: 'tourId',
        otherKey: 'tourguildId',
        as: "tour_tourguild",
      });
      Tour.belongsToMany(models.User, {
        through: 'TourDetail',
        foreignKey: 'tourId',
        otherKey: 'driverId',
        as: "tour_driver",
      });
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
    depatureDate: DataTypes.DATEONLY,
    depatureTime: DataTypes.TIME,
    endTime: DataTypes.TIME,
    routeId: {
      type: DataTypes.UUID
    },
    depatureStationId: {
      type: DataTypes.UUID
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
  return Tour;
};