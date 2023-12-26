'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RoutePointDetails', {
      routePoiId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      routeSegmentId: {
        type: Sequelize.UUID,
        references: {
          model: 'routeSegments',
          key: 'routeSegmentId'
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
    await queryInterface.dropTable('RoutePointDetails');
  }
};