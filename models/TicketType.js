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
      TicketType.hasOne(models.Price, { as: 'ticket_type_price', foreignKey: 'ticketTypeId'});

      TicketType.hasMany(models.Ticket, { as: 'type_ticket', foreignKey: 'ticketTypeId'});
    }
  }
  TicketType.init({
    ticketTypeId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketTypeName: DataTypes.STRING,
    description: DataTypes.STRING,
    dependsOnGuardian: DataTypes.BOOLEAN,
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

  TicketType.beforeUpdate((ticketType, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    ticketType.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return TicketType;
};