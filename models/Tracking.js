'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tracking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Tracking.belongsTo(models.Tour, {
        foreignKey: "tourId",
        as: "tracking_tour",
      });

      Tracking.belongsTo(models.Bus, {
        foreignKey: 'busId',
        as: 'tracking_bus'
      });
    }
  }
  Tracking.init({
    trackingId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    coordinates: DataTypes.JSON,
    tourId: {
      type: DataTypes.UUID
    },
    busId: {
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
    modelName: 'Tracking',
  });
  Tracking.beforeCreate((tracking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tracking.createdAt = currentDate;
    tracking.updatedAt = currentDate;
  });

  Tracking.beforeUpdate((tracking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tracking.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Tracking;
};