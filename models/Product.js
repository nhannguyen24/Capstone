'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.ProductCategory, {
        foreignKey: "productCateId",
        targetKey: 'productCateId',
        as: "product_cate",
      });

      Product.hasMany(models.ProductOrder, { as: 'product_order', foreignKey: 'productId'});
      Product.hasMany(models.Image, { as: 'product_image', foreignKey: 'productId'});
    }
  }
  Product.init({
    productId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productName: DataTypes.STRING,
    price: DataTypes.DECIMAL(3,3),
    productCateId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for product.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'Product',
  });
  Product.beforeCreate((product, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    product.createdAt = currentDate;
    product.updatedAt = currentDate;
  });

  Product.beforeUpdate((product, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    product.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return Product;
};