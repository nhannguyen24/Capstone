'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RouteDetails', {
      routeDetailId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stopoverTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      routeId: {
        type: Sequelize.UUID,
        references: {
          model: 'routes',
          key: 'routeId'
        }
      },
      stationId: {
        type: Sequelize.UUID,
        references: {
          model: 'stations',
          key: 'stationId'
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
    await queryInterface.dropTable('RouteDetails');
  }
};