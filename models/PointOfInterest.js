'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PointOfInterest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PointOfInterest.belongsToMany(models.Station, {
        through: 'RouteDetail',
        foreignKey: 'poiId',
        otherKey: 'stationId',
        as: "poi_station",
      });
      PointOfInterest.belongsToMany(models.Route, {
        through: 'RouteDetail',
        foreignKey: 'poiId',
        otherKey: 'routeId',
        as: "poi_route",
      });

      PointOfInterest.belongsToMany(models.Tour, {
        through: 'TourDetail',
        foreignKey: 'poiId',
        otherKey: 'tourId',
        as: "poi_tour",
      });

      PointOfInterest.hasMany(models.Image, { as: 'poi_image', foreignKey: 'poiId'});
    }
  }
  PointOfInterest.init({
    poiId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    poiName: DataTypes.STRING,
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
          msg: 'Invalid value for poi.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'PointOfInterest',
  });
  PointOfInterest.beforeCreate((poi, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    poi.createdAt = currentDate;
    poi.updatedAt = currentDate;
  });

  PointOfInterest.beforeUpdate((poi, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    poi.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return PointOfInterest;
};