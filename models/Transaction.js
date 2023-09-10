'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Transaction.belongsTo(models.Booking, {
        foreignKey: "bookingId",
        targetKey: 'bookingId',
        as: "transaction_booking",
      });
    }
  }
  Transaction.init({
    transactionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: DataTypes.DATE,
    amount: DataTypes.DECIMAL(3,3),
    bookingId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for transaction.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  // Transaction.beforeCreate((transaction, options) => {
  //   const currentDate = new Date();
  //   currentDate.setHours(currentDate.getHours() + 7);
  //   transaction.createdAt = currentDate;
  //   transaction.updatedAt = currentDate;
  // });
  return Transaction;
};