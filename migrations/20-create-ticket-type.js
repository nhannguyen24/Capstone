'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TicketTypes', {
      ticketTypeId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ticketTypeName: {
        type: Sequelize.STRING,
	      allowNull: false,
      },
      adultPriceId: {
        type: Sequelize.UUID,
        references: {
          model: 'prices',
          key: 'priceId'
        }
      },
      childPriceId: {
        type: Sequelize.UUID,
        references: {
          model: 'prices',
          key: 'priceId'
        }
      },
      status: {
        type: Sequelize.ENUM,
        values: ["Active", "Deactive"],
        defaultValue: 'Active',
      },
      createdAt: {
        allowNull: false,
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TicketTypes');
  }
};