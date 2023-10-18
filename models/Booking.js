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
    departureStationId: {
      type: DataTypes.UUID
    },
    isAttended: DataTypes.BOOLEAN,
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
      values: ["Active", "Draft", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Draft", "Deactive"]],
          msg: 'Invalid value for booking.status (Active, Draft, Deactive)'
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

    booking.status = STATUS.DRAFT;
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