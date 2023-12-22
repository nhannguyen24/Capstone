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
      Bus.hasMany(models.Schedule, { as: 'bus_schedule', foreignKey: 'busId'});

      Bus.hasMany(models.Image, { as: 'bus_image', foreignKey: 'busId'});
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
    isDoubleDecker: DataTypes.BOOLEAN,
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
    bus.setDataValue("updatedAt", currentDate)
  });
  return Bus;
};