'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductOrder.belongsTo(models.Product, {
        foreignKey: "productId",
        targetKey: 'productId',
        as: "order_product",
      });
      
      ProductOrder.belongsTo(models.BookingDetail, {
        foreignKey: "bookingDetailId",
        targetKey: 'bookingDetailId',
        as: "product_order_booking_detail",
      });
    }
  }
  ProductOrder.init({
    productOrderId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productPrice: DataTypes.DECIMAL(3,3),
    quantity: DataTypes.INTEGER,
    bookingDetailId: {
      type: DataTypes.UUID
    },
    productId: {
      type: DataTypes.UUID
    },
    status: {
      type: DataTypes.ENUM,
      values: ["Active", "Deactive"],
      validate: {
        isIn: {
          args: [["Active", "Deactive"]],
          msg: 'Invalid value for productOrder.status (Active, Deactive)'
        }
      }
    },
  }, {
    sequelize,
    modelName: 'ProductOrder',
  });
  ProductOrder.beforeCreate((productOrder, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    productOrder.createdAt = currentDate;
    productOrder.updatedAt = currentDate;
  });

  ProductOrder.beforeUpdate((productOrder, options) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);
    productOrder.setDataValue('updatedAt', currentDate); // Correctly update the updatedAt field
  });
  return ProductOrder;
};