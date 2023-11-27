'use strict';
const {
  Model
} = require('sequelize');
const BOOKING_STATUS = require('../enums/BookingStatusEnum')
module.exports = (sequelize, DataTypes) => {
  class BookingDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      BookingDetail.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'detail_booking'
      });
      
      BookingDetail.belongsTo(models.Ticket, {
        foreignKey: 'ticketId',
        as: 'booking_detail_ticket'
      });
    }
  }
  BookingDetail.init({
    bookingDetailId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketPrice: DataTypes.INTEGER,
    bookingId: {
      type: DataTypes.UUID
    },
    ticketId: {
      type: DataTypes.UUID
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Draft", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Draft", "Deactive"]],
          msg: 'Invalid value for bookingDetail.status (Active, Draft, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'BookingDetail',
  });
  BookingDetail.beforeCreate((bookingDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    bookingDetail.createdAt = currentDate;
    bookingDetail.updatedAt = currentDate;
  });

  BookingDetail.beforeUpdate((bookingDetail, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    bookingDetail.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return BookingDetail;
};
