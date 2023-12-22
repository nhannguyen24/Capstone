'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      transactionId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      transactionCode: {
        type: Sequelize.ENUM,
        values: ["MOMO", "PAY-OS", "Cash"],
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      transactionType: {
        type: Sequelize.DECIMAL(3, 3),
        allowNull: false,
      },
      bookingId: {
        type: Sequelize.UUID,
        references: {
          model: 'bookings',
          key: 'bookingId'
        }
      },
      refundAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM,
        values: ["Draft", "Paid", "Refunded"],
        defaultValue: 'Draft',
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
    await queryInterface.dropTable('Transactions');
  }
};