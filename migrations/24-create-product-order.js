'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductOrders', {
      productOrderId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      productPrice: {
        type: Sequelize.DECIMAL(3,3),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bookingDetailId: {
        type: Sequelize.UUID,
        references: {
          model: 'bookingdetails',
          key: 'bookingDetailId'
        }
      },
      productId: {
        type: Sequelize.UUID,
        references: {
          model: 'products',
          key: 'productId'
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
    await queryInterface.dropTable('ProductOrders');
  }
};