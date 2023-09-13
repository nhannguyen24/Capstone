'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BusCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BusCategory.hasMany(models.Bus, { as: 'cate_bus', foreignKey: 'busCateId'});
    }
  }
  BusCategory.init({
    busCateId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    busCateName: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for busCategory.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'BusCategory',
  });
  BusCategory.beforeCreate((busCategory, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    busCategory.createdAt = currentDate;
    busCategory.updatedAt = currentDate;
  });

  BusCategory.beforeUpdate((busCategory, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    busCategory.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return BusCategory;
};