'use strict';
const {
  Model
} = require('sequelize');

const BOOKING_STATUS = require("../enums/BookingStatusEnum");
const STATUS = require('../enums/StatusEnum');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, {
        foreignKey: "customerId",
        targetKey: 'userId',
        as: "booking_user",
      });

      Booking.belongsTo(models.Station, {
        foreignKey: "departureStationId",
        targetKey: 'stationId',
        as: "booking_departure_station",
      });

      Booking.hasMany(models.Transaction, { as: 'booking_transaction', foreignKey: 'bookingId' });

      Booking.belongsToMany(models.TicketType, {
        through: 'BookingDetail',
        foreignKey: 'bookingId',
        otherKey: 'ticketId',
        as: "booking_ticket_type",
      });

      Booking.hasMany(models.BookingDetail, { as: 'booking_detail', foreignKey: 'bookingId'});
    }
  }
  Booking.init({
    bookingId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingDate: DataTypes.DATE,
    endPaymentTime: DataTypes.DATE,
    bookingCode: DataTypes.STRING,
    totalPrice: DataTypes.INTEGER,
    customerId: {
      type: DataTypes.UUID
    },
    departureStationId: {
      type: DataTypes.UUID
    },
    isAttended: DataTypes.BOOLEAN,
    bookingStatus: {
      type: DataTypes.ENUM,
      values: ["Draft", "Ongoing", "Canceled", "Finished"],
      validate: {
        isIn: {
          args: [["Draft", "Ongoing", "Canceled", "Finished"]],
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
    const bookingCode = `BO${currentDate.getTime()}`
    const currentDateAfter1Hour = new Date()
    currentDateAfter1Hour.setHours(currentDateAfter1Hour.getHours() + 8)
    booking.bookingStatus = BOOKING_STATUS.DRAFT;
    booking.endPaymentTime = currentDateAfter1Hour
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