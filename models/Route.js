'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Route extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Route.belongsToMany(models.Station, {
        through: 'RouteDetail',
        foreignKey: 'routeId',
        otherKey: 'stationId',
        as: "route_station",
      });

      Route.hasMany(models.RouteSegment, { as: 'route_segment', foreignKey: 'routeId'});
    }
  }
  Route.init({
    routeId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    routeName: DataTypes.STRING,
    distance: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for route.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Route',
  });
  Route.beforeCreate((route, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    route.createdAt = currentDate;
    route.updatedAt = currentDate;
  });

  Route.beforeUpdate((route, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    route.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Route;
};