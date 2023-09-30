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
    transactionCode: DataTypes.STRING,
    amount: DataTypes.INTEGER,
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
  Transaction.beforeCreate((transaction, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    let transactionCode
    
    const stringCurrentDay = currentDate.getDate().toString().padStart(2, '0');
    const stringCurrentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const stringCurrentYear = currentDate.getFullYear().toString();
    const stringCurrentHour = currentDate.getHours().toString().toString().padStart(2, '0');
    const stringCurrentMinute = currentDate.getMinutes().toString().toString().padStart(2, '0');
    const stringCurrentSecond = currentDate.getSeconds().toString().toString().padStart(2, '0');

    transactionCode = `TR${stringCurrentYear}${stringCurrentMonth}${stringCurrentDay}${stringCurrentHour}${stringCurrentMinute}${stringCurrentSecond}`
    transaction.transactionCode = transactionCode
    transaction.createdAt = currentDate;
    transaction.updatedAt = currentDate;
  });
  return Transaction;
};
