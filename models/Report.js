'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Report.belongsTo(models.User, {
        foreignKey: "customerId",
        targetKey: 'userId',
        as: "report_user",
      });
    }
  }
  Report.init({
    reportId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    customerId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for report.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Report',
  });
  Report.beforeCreate((report, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    report.createdAt = currentDate;
    report.updatedAt = currentDate;
  });

  Report.beforeUpdate((report, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    report.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Report;
};