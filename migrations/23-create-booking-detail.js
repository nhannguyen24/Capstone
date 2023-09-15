'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingDetails', {
      bookingDetailId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      TicketPrice: {
        type: Sequelize.DECIMAL(3,3),
        allowNull: false,
      },
      bookingId: {
        type: Sequelize.UUID,
        references: {
          model: 'bookings',
          key: 'bookingId'
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
    await queryInterface.dropTable('BookingDetails');
  }
};