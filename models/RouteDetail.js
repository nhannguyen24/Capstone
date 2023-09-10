'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RouteDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RouteDetail.belongsTo(models.Route, {
        foreignKey: 'routeId',
        as: 'route_detail_route'
      });
      
      RouteDetail.belongsTo(models.Station, {
        foreignKey: 'stationId',
        as: 'route_detail_station'
      });

      RouteDetail.belongsTo(models.PointOfInterest, {
        foreignKey: 'poiId',
        as: 'route_detail_poi'
      });
    }
  }
  RouteDetail.init({
    routeDetailId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    routeId: {
      type: DataTypes.UUID
    },
    stationId: {
      type: DataTypes.UUID
    },
    poiId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for routeDetail.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'RouteDetail',
  });
  RouteDetail.beforeCreate((routeDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    routeDetail.createdAt = currentDate;
    routeDetail.updatedAt = currentDate;
  });
  return RouteDetail;
};