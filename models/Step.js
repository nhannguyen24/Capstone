'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Step extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Step.belongsTo(models.RouteDetail, {
        foreignKey: "routeDetailId",
        targetKey: 'routeDetailId',
        as: "step_route_detail",
      });
    }
  }
  Step.init({
    stepId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    index: DataTypes.INTEGER,
    latitude: DataTypes.DECIMAL(8,6),
    longitude: DataTypes.DECIMAL(9,6),
    routeDetailId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for step.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Step',
  });
  Step.beforeCreate((step, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    step.createdAt = currentDate;
    step.updatedAt = currentDate;
  });

  Step.beforeUpdate((step, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    step.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });

  return Step;
};