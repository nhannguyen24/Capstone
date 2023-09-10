'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tickets', {
      ticketId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      numberAdult: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      numberChild: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      tourId: {
        type: Sequelize.UUID,
        references: {
          model: 'tours',
          key: 'tourId'
        }
      },
      ticketTypeId: {
        type: Sequelize.UUID,
        references: {
          model: 'tickettypes',
          key: 'ticketTypeId'
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
    await queryInterface.dropTable('Tickets');
  }
};