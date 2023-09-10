'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Price extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Price.hasMany(models.TicketType, { as: 'type_adult_ticket', foreignKey: 'priceId'});
      Price.hasMany(models.TicketType, { as: 'type_child_ticket', foreignKey: 'priceId'});
    }
  }
  Price.init({
    priceId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: DataTypes.DECIMAL(3,3),
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for price.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Price',
  });
  Price.beforeCreate((price, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    price.createdAt = currentDate;
    price.updatedAt = currentDate;
  });
  return Price;
};