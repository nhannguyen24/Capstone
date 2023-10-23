'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Feedback.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: 'userId',
        as: "feedback_user",
      });
      Feedback.belongsTo(models.Route, {
        foreignKey: "routeId",
        targetKey: 'routeId',
        as: "feedback_route",
      });
      // Feedback.hasMany(models.Image, { as: 'feedback_image', foreignKey: 'feedbackId'});
    }
  }
  Feedback.init({
    feedbackId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    description: DataTypes.STRING,
    userId: {
      type: DataTypes.UUID
    },
    routeId: {
      type: DataTypes.UUID
    },
    stars: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for feedback.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Feedback',
  });
  Feedback.beforeCreate((feedback, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    feedback.createdAt = currentDate;
    feedback.updatedAt = currentDate;
  });

  Feedback.beforeUpdate((feedback, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    feedback.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Feedback;
};