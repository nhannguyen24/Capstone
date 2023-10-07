'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RouteSegment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RouteSegment.belongsTo(models.Route, {
        foreignKey: 'routeId',
        as: 'segment_route'
      });
      
      RouteSegment.belongsTo(models.Station, {
        foreignKey: 'departureStationId',
        as: 'segment_departure_station'
      });

      RouteSegment.belongsTo(models.Station, {
        foreignKey: 'endStationId',
        as: 'segment_end_station'
      });

      // RouteSegment.belongsToMany(models.PointOfInterest, {
      //   through: 'RoutePointDetail',
      //   foreignKey: 'poiId',
      //   otherKey: 'routeSegmentId',
      //   as: "poi_segment",
      // });

      RouteSegment.hasMany(models.RoutePointDetail, { as: 'segment_route_poi_detail', foreignKey: 'routeSegmentId'});
    }
  }
  RouteSegment.init({
    routeSegmentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // stopoverTime: DataTypes.TIME,
    index: DataTypes.INTEGER,
    geoJson: DataTypes.JSON,
    routeId: {
      type: DataTypes.UUID
    },
    departureStationId: {
      type: DataTypes.UUID
    },
    endStationId: {
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
    modelName: 'RouteSegment',
  });
  RouteSegment.beforeCreate((routeDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    routeDetail.createdAt = currentDate;
    routeDetail.updatedAt = currentDate;
  });

  RouteSegment.beforeUpdate((routeDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    routeDetail.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return RouteSegment;
};