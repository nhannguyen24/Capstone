'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BookingDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BookingDetail.hasMany(models.ProductOrder, { as: 'booking_detail_product_order', foreignKey: 'bookingDetailId'});

      BookingDetail.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'detail_booking'
      });
      
      BookingDetail.belongsTo(models.TicketType, {
        foreignKey: 'ticketTypeId',
        as: 'detail_booking_ticket_type'
      });
    }
  }
  BookingDetail.init({
    bookingDetailId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    totalTicketPrice: DataTypes.DECIMAL(3,3),
    bookingId: {
      type: DataTypes.UUID
    },
    ticketTypeId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for bookingDetail.status (Active, Deactive)'
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
  return BookingDetail;
};