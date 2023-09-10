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
      poiId: {
        type: Sequelize.UUID,
        references: {
          model: 'pointofinterests',
          key: 'poiId'
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