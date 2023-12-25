'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TourDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TourDetail.belongsTo(models.Schedule, {
        foreignKey: "scheduleId",
        as: "detail_schedule",
      });

      TourDetail.belongsTo(models.Station, {
        foreignKey: 'stationId',
        as: 'tour_detail_station'
      });
    }
  }
  TourDetail.init({
    tourDetailId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    index: DataTypes.INTEGER,
    scheduleId: {
      type: DataTypes.UUID
    },
    stationId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "NotArrived", "Arrived", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "NotArrived", "Arrived", "Deactive"]],
          msg: 'Invalid value for tourDetail.status (Active, NotArrived, Arrived, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'TourDetail',
  });
  TourDetail.beforeCreate((tourDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tourDetail.createdAt = currentDate;
    tourDetail.updatedAt = currentDate;
  });

  TourDetail.beforeUpdate((tourDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tourDetail.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return TourDetail;
};