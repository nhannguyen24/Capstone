'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, {
        foreignKey: "customerId",
        targetKey: 'userId',
        as: "booking_user",
      });

      Booking.hasMany(models.Transaction, { as: 'booking_transaction', foreignKey: 'bookingId'});
      
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
    totalPrice: DataTypes.DECIMAL(3,3),
    numberAdult: DataTypes.INTEGER,
    numberChild: DataTypes.INTEGER,
    customerId: {
      type: DataTypes.UUID
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
  Booking.beforeCreate((booking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    booking.createdAt = currentDate;
    booking.updatedAt = currentDate;
  });

  Booking.beforeUpdate((booking, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    booking.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Booking;
};