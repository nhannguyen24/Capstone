'use strict';
const {
  Model
} = require('sequelize');

const BOOKING_STATUS = require("../enums/BookingStatusEnum")
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, {
        foreignKey: "customerId",
        targetKey: 'userId',
        as: "booking_user",
      });

      Booking.hasMany(models.Transaction, { as: 'booking_transaction', foreignKey: 'bookingId' });

      Booking.belongsToMany(models.TicketType, {
        through: 'BookingDetail',
        foreignKey: 'bookingId',
        otherKey: 'ticketId',
        as: "booking_ticket_type",
      });
    }
  }
  Booking.init({
    bookingId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingDate: DataTypes.DATE,
    bookingCode: DataTypes.STRING,
    totalPrice: DataTypes.INTEGER,
    customerId: {
      type: DataTypes.UUID
    },
    bookingStatus: {
      type: DataTypes.ENUM,
      values: ["Ongoing", "Canceled", "Finished"],
      validate: {
        isIn: {
          args: [["Ongoing", "Canceled", "Finished"]],
          msg: 'Invalid value for booking.status (Ongoing, Canceled, Finished)'
        }
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for booking.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Booking',
  });


  Booking.beforeCreate(async (booking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);

    let bookingCode;

    const stringCurrentDay = currentDate.getDate().toString().padStart(2, '0');
    const stringCurrentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const stringCurrentYear = currentDate.getFullYear().toString();
    const stringCurrentHour = currentDate.getHours().toString().toString().padStart(2, '0');
    const stringCurrentMinute = currentDate.getMinutes().toString().toString().padStart(2, '0');
    const stringCurrentSecond = currentDate.getSeconds().toString().toString().padStart(2, '0');

    bookingCode = `BO${stringCurrentYear}${stringCurrentMonth}${stringCurrentDay}${stringCurrentHour}${stringCurrentMinute}${stringCurrentSecond}`

    booking.bookingStatus = BOOKING_STATUS.ON_GOING;
    booking.bookingDate = currentDate;
    booking.createdAt = currentDate;
    booking.updatedAt = currentDate;
    booking.bookingCode = bookingCode
  });

  Booking.beforeUpdate((booking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    booking.setDataValue("updatedAt", currentDate)
  });
  return Booking;
};