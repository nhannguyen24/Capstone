'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Form extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Form.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: 'userId',
        as: "form_user",
      });

    }
  }
  Form.init({
    formId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reason: DataTypes.STRING(500),
    file: DataTypes.STRING(1000),
    userId: {
      type: DataTypes.UUID,
    },
    currentTour: DataTypes.STRING,
    desireTour: DataTypes.STRING,
    changeEmployee: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Approved", "Rejected"],
      validate: {
        isIn: {
          args: [["Active", "Approved", "Rejected"]],
          msg: 'Invalid value for form.status (Active, Approved, Rejected)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Form',
  });
  Form.beforeCreate((form, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    form.createdAt = currentDate;
    form.updatedAt = currentDate;
  });

  Form.beforeUpdate((form, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    form.setDataValue("updatedAt", currentDate)
  });
  return Form;
};