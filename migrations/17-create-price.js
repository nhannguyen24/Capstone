'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Prices', {
      priceId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      amount: {
        type: Sequelize.DECIMAL(3,3),
        allowNull: false,
      },
      ticketTypeId: {
        type: Sequelize.UUID,
        references: {
          model: 'tickettypes',
          key: 'ticketTypeId'
        }
      },
      day: {
        type: Sequelize.ENUM,
        values: ["Normal", "Weekend", "Holiday"],
        defaultValue: 'Normal',
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
    await queryInterface.dropTable('Prices');
  }
};