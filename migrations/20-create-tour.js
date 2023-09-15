'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tours', {
      tourId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tourName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
      },
      note: {
        type: Sequelize.STRING,
      },
      beginBookingDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endBookingDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      departureDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      departureTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      endTime: {
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
      departureStationId: {
        type: Sequelize.UUID,
        references: {
          model: 'stations',
          key: 'stationId'
        }
      },
      tourStatus: {
        type: Sequelize.ENUM,
        values: ["NotStarted", "Ontour", "Canceled", "Finished"],
        defaultValue: 'Ontour',
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
    await queryInterface.dropTable('Tours');
  }
};