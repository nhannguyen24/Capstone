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
      ticketPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bookingId: {
        type: Sequelize.UUID,
        references: {
          model: 'bookings',
          key: 'bookingId'
        }
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      ticketId: {
        type: Sequelize.UUID,
        references: {
          model: 'tickets',
          key: 'ticketId'
        }
      },
      status: {
        type: Sequelize.ENUM,
        values: ["Active", "Draft", "Canceled"],
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