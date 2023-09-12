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
      TourDetail.belongsTo(models.Bus, {
        foreignKey: 'busId',
        as: 'tour_detail_bus'
      });
      
      TourDetail.belongsTo(models.Tour, {
        foreignKey: 'tourId',
        as: 'tour_detail_tour'
      });

      TourDetail.belongsTo(models.User, {
        foreignKey: 'tourguildId',
        as: 'tour_detail_tourguild'
      });
      
      TourDetail.belongsTo(models.User, {
        foreignKey: 'driverId',
        as: 'tour_detail_driver'
      });
    }
  }
  TourDetail.init({
    tourDetailId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: DataTypes.DATE,
    busId: {
      type: DataTypes.UUID
    },
    tourId: {
      type: DataTypes.UUID
    },
    tourguildId: {
      type: DataTypes.UUID
    },
    driverId: {
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