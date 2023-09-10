'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ticket.belongsTo(models.User, {
        foreignKey: "customerId",
        targetKey: 'userId',
        as: "ticket_user",
      });
      Ticket.belongsTo(models.Tour, {
        foreignKey: "tourId",
        targetKey: 'tourId',
        as: "ticket_tour",
      });
      Ticket.belongsTo(models.TicketType, {
        foreignKey: "ticketTypeId",
        targetKey: 'ticketTypeId',
        as: "ticket_type",
      });
    }
  }
  Ticket.init({
    ticketId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numberAdult: DataTypes.INTEGER,
    numberChild: DataTypes.INTEGER,
    customerId: {
      type: DataTypes.UUID
    },
    tourId: {
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
          msg: 'Invalid value for ticket.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  Ticket.beforeCreate((ticket, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    ticket.createdAt = currentDate;
    ticket.updatedAt = currentDate;
  });
  return Ticket;
};