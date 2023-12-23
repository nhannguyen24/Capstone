'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reports', {
      reportId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reportUserId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      response: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scheduleId: {
        type: Sequelize.UUID,
        references: {
          model: 'schedules',
          key: 'scheduleId'
        }
      },
      responseUserId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      reportStatus: {
        type: Sequelize.ENUM,
        values: ["Approved", "Pending", "Rejected"],
        defaultValue: 'Pending',
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
    await queryInterface.dropTable('Reports');
  }
};