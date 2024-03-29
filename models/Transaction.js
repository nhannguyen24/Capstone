'use strict';
const {
  Model
} = require('sequelize');
const STATUS = require("../enums/StatusEnum")
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
    transactionCode: DataTypes.STRING,
    transactionType: {
      type: DataTypes.ENUM,
      values: [["MOMO", "PAY-OS", "Cash", "STRIPE"],],
      validate: {
        isIn: {
          args: [["MOMO", "PAY-OS", "Cash", "STRIPE"]],
          msg: 'Invalid value for transaction.type (MOMO, PAY-OS, Cash, STRIPE)'
        }
      }
    },
    amount: DataTypes.INTEGER,
    refundAmount: DataTypes.INTEGER,
    bookingId: {
      type: DataTypes.UUID
    },
    isPaidToManager: {
      type: DataTypes.BOOLEAN
    },
    status: {
      type: DataTypes.ENUM,
      values: [["Draft", "Paid", "Refunded"],],
      validate: {
        isIn: {
          args: [["Draft", "Paid", "Refunded"]],
          msg: 'Invalid value for transaction.status (Draft, Paid, Refunded)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  Transaction.beforeCreate((transaction, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    transaction.createdAt = currentDate;
    transaction.updatedAt = currentDate;
  });
  return Transaction;
};
