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
    longtitude: DataTypes.DECIMAL(9,6),
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
  return PointOfInterest;
};