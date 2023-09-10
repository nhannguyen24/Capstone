'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductCategory.hasMany(models.Product, { as: 'cate_product', foreignKey: 'productCateId'});
    }
  }
  ProductCategory.init({
    productCateId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productCateName: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for productCategory.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'ProductCategory',
  });
  ProductCategory.beforeCreate((productCate, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    productCate.createdAt = currentDate;
    productCate.updatedAt = currentDate;
  });
  return ProductCategory;
};