'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TicketType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TicketType.belongsTo(models.Price, {
        foreignKey: "adultPriceId",
        targetKey: 'priceId',
        as: "ticket_type_adult_price",
      });
      TicketType.belongsTo(models.Price, {
        foreignKey: "childPriceId",
        targetKey: 'priceId',
        as: "ticket_type_child_price",
      });

      TicketType.hasMany(models.Ticket, { as: 'type_ticket', foreignKey: 'ticketTypeId'});
      
      TicketType.belongsToMany(models.Booking, {
        through: 'BookingDetail',
        foreignKey: 'ticketTypeId',
        otherKey: 'bookingId',
        as: "ticket_type_booking",
      });
    }
  }
  TicketType.init({
    ticketTypeId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketTypeName: DataTypes.STRING,
    adultPriceId: {
      type: DataTypes.UUID
    },
    childPriceId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for ticketType.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'TicketType',
  });
  TicketType.beforeCreate((ticketType, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    ticketType.createdAt = currentDate;
    ticketType.updatedAt = currentDate;
  });
  return TicketType;
};