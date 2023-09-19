'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Otp.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: 'userId',
        as: "otp_user",
      });
    }
  }
  Otp.init({
    otpId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    otp: DataTypes.STRING,
    time_expired: DataTypes.DATE,
    userId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for otp.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Otp',
  });

  Otp.beforeCreate((otp, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    otp.createdAt = currentDate;
    otp.updatedAt = currentDate;
  });

  Otp.beforeUpdate((otp, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    otp.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });

  return Otp;
};