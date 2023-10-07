'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Buses', {
      busId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      busPlate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      numberSeat: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isDoubleDecker: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.ENUM,
        values: ["Active", "Deactive", "Maintain", "Ongoing"],
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
    await queryInterface.dropTable('Buses');
  }
};