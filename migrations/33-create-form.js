'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Forms', {
      formId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file: {
        type: Sequelize.STRING(1000),
      },
      currentTour: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      desireTour: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      changeEmployee: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM,
        values: ["Active", "Approved", "Rejected"],
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
    await queryInterface.dropTable('Forms');
  }
};