'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      productId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      productName: {
        type: Sequelize.STRING,
	      allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(3,3),
        allowNull: false,
      },
      productCateId: {
        type: Sequelize.UUID,
        references: {
          model: 'productcategories',
          key: 'productCateId'
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
    await queryInterface.dropTable('Products');
  }
};