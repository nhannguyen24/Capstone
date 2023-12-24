'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tour extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Tour.hasMany(models.Schedule, { as: 'tour_schedule', foreignKey: 'tourId'});
      Tour.hasMany(models.RouteSegment, { as: 'tour_segment', foreignKey: 'tourId'});
      Tour.hasMany(models.Ticket, { as: 'tour_ticket', foreignKey: 'tourId'});
      Tour.hasMany(models.Image, { as: 'tour_image', foreignKey: 'tourId'});
    }
  }
  Tour.init({
    tourId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tourName: DataTypes.STRING,
    description: DataTypes.STRING,
    duration: DataTypes.TIME,
    distance: DataTypes.DECIMAL(18,2),
    geoJson: DataTypes.JSON,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for tour.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Tour',
  });
  Tour.beforeCreate((tour, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tour.createdAt = currentDate;
    tour.updatedAt = currentDate;
  });

  Tour.beforeUpdate((tour, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    tour.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Tour;
};