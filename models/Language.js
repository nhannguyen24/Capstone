'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Language extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Language.init({
    languageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    language: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for language.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Language',
  });
  Language.beforeCreate((language, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    language.createdAt = currentDate;
    language.updatedAt = currentDate;
  });

  Language.beforeUpdate((language, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    language.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Language;
};