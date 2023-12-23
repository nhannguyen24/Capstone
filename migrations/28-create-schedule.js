'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Schedules', {
      scheduleId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      departureDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      departureStation: {
        type: Sequelize.STRING,
      },
      isScheduled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      tourId: {
        type: Sequelize.UUID,
        references: {
          model: 'tours',
          key: 'tourId'
        }
      },
      tourGuideId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      driverId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      busId: {
        type: Sequelize.UUID,
        references: {
          model: 'buses',
          key: 'busId'
        }
      },
      tourStatus: {
        type: Sequelize.ENUM,
        values: ["Available", "Started", "Canceled", "Finished"],
        defaultValue: 'Available',
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
    await queryInterface.dropTable('Schedules');
  }
};