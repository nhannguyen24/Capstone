'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FileSound extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      FileSound.belongsTo(models.PointOfInterest, {
        foreignKey: "poiId",
        targetKey: 'poiId',
        as: "sound_point",
      });
      FileSound.belongsTo(models.Language, {
        foreignKey: "languageId",
        targetKey: 'languageId',
        as: "sound_language",
      });
    }
  }
  FileSound.init({
    soundId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    file: DataTypes.STRING(1000),
    poiId: {
      type: DataTypes.UUID,
    },
    languageId: {
      type: DataTypes.UUID,
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for sound.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'FileSound',
  });
  FileSound.beforeCreate((sound, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    sound.createdAt = currentDate;
    sound.updatedAt = currentDate;
  });

  FileSound.beforeUpdate((sound, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    sound.setDataValue("updatedAt", currentDate)
  });
  return FileSound;
};