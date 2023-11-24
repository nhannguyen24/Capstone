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
      Price.belongsTo(models.TicketType, {
        foreignKey: "ticketTypeId",
        targetKey: 'ticketTypeId',
        as: "price_ticket_type",
      });
    }
  }
  Price.init({
    priceId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: DataTypes.INTEGER,
    ticketTypeId: {
      type: DataTypes.UUID
    },
    day: {
      type: DataTypes.ENUM,
      values: ["Normal", "Weekend", "Holiday"],
      validate: {
        isIn: {
          args: [["Normal", "Weekend", "Holiday"]],
          msg: 'Invalid value for price.status (Normal, Weekend, Holiday)'
        }
      }
    },
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

  Price.beforeUpdate((price, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    price.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Price;
};