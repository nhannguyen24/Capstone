'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: "roleId",
        targetKey: 'roleId',
        as: "user_role",
      });
      // User.hasMany(models.Foods, { as: 'user_food', foreignKey: 'user_id'});
      // User.hasMany(models.Store, { as: 'user_store', foreignKey: 'user_id'});
      // User.hasMany(models.Blog, { as: 'user_blog', foreignKey: 'user_id'});
    }
  }
  User.init({
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userName: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    birthday: DataTypes.DATEONLY,
    avatar: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING(10),
    roleId: {
      type: DataTypes.UUID
    },
    refreshToken: DataTypes.STRING,
    accessChangePassword: DataTypes.BOOLEAN,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for user.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate((user, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    user.createdAt = currentDate;
    user.updatedAt = currentDate;
  });
  return User;
};