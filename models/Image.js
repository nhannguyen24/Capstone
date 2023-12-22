'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Image.belongsTo(models.Bus, {
        foreignKey: "busId",
        targetKey: 'busId',
        as: "image_bus",
      });
      Image.belongsTo(models.Tour, {
        foreignKey: "tourId",
        targetKey: 'tourId',
        as: "image_tour",
      });
      Image.belongsTo(models.PointOfInterest, {
        foreignKey: "poiId",
        targetKey: 'poiId',
        as: "image_poi",
      });
    }
  }
  Image.init({
    imageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    image: DataTypes.STRING,
    busId: {
      type: DataTypes.UUID,
    },
    tourId: {
      type: DataTypes.UUID,
    },
    poiId: {
      type: DataTypes.UUID,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Active', 'Deactive'],
      validate: {
        isIn: {
          args: [['Active', 'Deactive']],
          msg: 'Invalid value for image.status (Active, Deactive)'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Image',
  });
  Image.beforeCreate((image, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    image.createdAt = currentDate;
    image.updatedAt = currentDate;
  });

  Image.beforeUpdate((image, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    image.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Image;
};