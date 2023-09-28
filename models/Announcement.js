'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Announcement.belongsTo(models.User, {
        foreignKey: "managerId",
        targetKey: 'userId',
        as: "announcement_user",
      });
    }
  }
  Announcement.init({
    announcementId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    managerId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for announcement.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Announcement',
  });
  Announcement.beforeCreate((announcement, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    announcement.createdAt = currentDate;
    announcement.updatedAt = currentDate;
  });

  Announcement.beforeUpdate((announcement, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    announcement.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Announcement;
};