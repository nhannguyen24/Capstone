'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Station extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Station.hasMany(models.Tour, { as: 'station_tour', foreignKey: 'stationId'});
      
      Station.belongsToMany(models.Route, {
        through: 'RouteDetail',
        foreignKey: 'stationId',
        otherKey: 'routeId',
        as: "station_route",
      });
      Station.belongsToMany(models.PointOfInterest, {
        through: 'RouteDetail',
        foreignKey: 'stationId',
        otherKey: 'poiId',
        as: "station_poi",
      });
    }
  }
  Station.init({
    stationId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    stationName: DataTypes.STRING,
    description: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: DataTypes.DECIMAL(8,6),
    longitude: DataTypes.DECIMAL(9,6),
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for station.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Station',
  });
  Station.beforeCreate((station, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    station.createdAt = currentDate;
    station.updatedAt = currentDate;
  });

  Station.beforeUpdate((station, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    station.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });

  return Station;
};