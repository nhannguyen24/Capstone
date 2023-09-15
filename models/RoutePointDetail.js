'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoutePointDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RoutePointDetail.belongsTo(models.Route, {
        foreignKey: 'routeId',
        as: 'route_poi_detail_route'
      });

      RoutePointDetail.belongsTo(models.PointOfInterest, {
        foreignKey: 'poiId',
        as: 'route_poi_detail_poi'
      });
    }
  }
  RoutePointDetail.init({
    routepoiId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    routeId: {
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
          msg: 'Invalid value for tourDetail.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'RoutePointDetail',
  });
  RoutePointDetail.beforeCreate((routePointDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    routePointDetail.createdAt = currentDate;
    routePointDetail.updatedAt = currentDate;
  });

  RoutePointDetail.beforeUpdate((routePointDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    routePointDetail.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return RoutePointDetail;
};