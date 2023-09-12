'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Bus.belongsToMany(models.Tour, {
        through: 'TourDetail',
        foreignKey: 'busId',
        otherKey: 'tourId',
        as: "bus_tour",
      });
      Bus.belongsToMany(models.User, {
        through: 'TourDetail',
        foreignKey: 'busId',
        otherKey: 'tourguildId',
        as: "bus_tourguild",
      });
      Bus.belongsToMany(models.User, {
        through: 'TourDetail',
        foreignKey: 'busId',
        otherKey: 'driverId',
        as: "bus_driver",
      });
      Bus.hasMany(models.Image, { as: 'bus_image', foreignKey: 'busId'});

      Bus.belongsTo(models.BusCategory, {
        foreignKey: "busCateId",
        targetKey: 'busCateId',
        as: "cate_bus",
      });
    }
  }
  Bus.init({
    busId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    busPlate: DataTypes.STRING,
    numberSeat: DataTypes.INTEGER,
    busCateId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for bus.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Bus',
  });
  Bus.beforeCreate((bus, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    bus.createdAt = currentDate;
    bus.updatedAt = currentDate;
  });

  Bus.beforeUpdate((bus, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    bus.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Bus;
};