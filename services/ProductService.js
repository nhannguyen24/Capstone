const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllProduct = (
    { page, limit, order, productName, status, productCateId, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`products_${page}_${limit}_${order}_${productName}_${status}_${productCateId}`, async (error, product) => {
                if (product != null && product != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got products",
                            products: JSON.parse(product),
                        }
                    });
                } else {
                    redisClient.get(`admin_products_${page}_${limit}_${order}_${productName}_${status}_${productCateId}`, async (error, adminProduct) => {
                        if (adminProduct != null && adminProduct != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got products",
                                    products: JSON.parse(adminProduct),
                                }
                            });
                        } else {
                            const queries = { nest: true };
                            const offset = !page || +page <= 1 ? 0 : +page - 1;
                            const flimit = +limit || +process.env.LIMIT_POST;
                            queries.offset = offset * flimit;
                            queries.limit = flimit;
                            if (order) queries.order = [[order]]
                            else {
                                queries.order = [['updatedAt', 'DESC']];
                            }
                            if (productName) query.productName = { [Op.substring]: productName };
                            if (status) query.status = { [Op.eq]: status };
                            if (productCateId) query.productCateId = { [Op.eq]: productCateId };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const products = await db.Product.findAll({
                                where: query,
                                ...queries,
                                include: [
                                    {
                                        model: db.Image,
                                        as: "product_image",
                                        attributes: {
                                            exclude: [
                                                "productId",
                                                "busId",
                                                "tourId",
                                                "productId",
                                                "poiId",
                                                "feedbackId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    }
                                ]
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`products_${page}_${limit}_${order}_${productName}_${status}_${productCateId}`, 3600, JSON.stringify(products));
                            } else {
                                redisClient.setEx(`admin_products_${page}_${limit}_${order}_${productName}_${status}_${productCateId}`, 3600, JSON.stringify(products));
                            }
                            resolve({
                                status: products ? 200 : 404,
                                data: {
                                    msg: products ? "Got products" : "Cannot find products",
                                    products: products,
                                }
                            });
                        }
                    })
                }
            })
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getProductById = (productId) =>
    new Promise(async (resolve, reject) => {
        try {
            const product = await db.Product.findOne({
                where: { productId: productId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Image,
                        as: "product_image",
                        attributes: {
                            exclude: [
                                "productId",
                                "busId",
                                "tourId",
                                "poiId",
                                "productId",
                                "feedbackId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    }
                ]
            });
            resolve({
                status: product ? 200 : 404,
                data: {
                    msg: product ? "Got product" : `Cannot find product with id: ${productId}`,
                    product: product,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createProduct = ({ images, productName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createProduct = await db.Product.findOrCreate({
                where: {
                    productName: productName
                },
                defaults: {
                    productName: productName,
                    ...body,
                },
            });

            if (images) {
                const createImagePromises = images.map(async (image) => {
                    await db.Image.create({
                        image: image,
                        productId: createProduct[0].productId,
                    });
                });

                await Promise.all(createImagePromises);
            }

            resolve({
                status: createProduct[1] ? 200 : 400,
                data: {
                    msg: createProduct[1]
                        ? "Create new product successfully"
                        : "Cannot create new product/Point name already exists",
                    product: createProduct[1] ? createProduct[0].dataValues : null,
                }
            });
            redisClient.keys('*products_*', (error, keys) => {
                if (error) {
                    console.error('Error retrieving keys:', error);
                    return;
                }
                // Delete each key individually
                keys.forEach((key) => {
                    redisClient.del(key, (deleteError, reply) => {
                        if (deleteError) {
                            console.error(`Error deleting key ${key}:`, deleteError);
                        } else {
                            console.log(`Key ${key} deleted successfully`);
                        }
                    });
                });
            });

        } catch (error) {
            reject(error);
        }
    });

const updateProduct = ({ images, productId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const product = await db.Product.findOne({
                where: {
                    productName: body?.productName,
                    productId: {
                        [Op.ne]: productId
                    }
                }
            })

            if (product !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Product name already exists"
                    }
                });
            } else {
                const products = await db.Product.update(body, {
                    where: { productId },
                    individualHooks: true,
                });

                if (images) {
                    await db.Image.destroy({
                        where: {
                            productId: productId,
                        }
                    });

                    const createImagePromises = images.map(async (image) => {
                        await db.Image.create({
                            image: image,
                            productId: productId,
                        });
                    });

                    await Promise.all(createImagePromises);
                }

                resolve({
                    status: products[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            products[1].length !== 0
                                ? `Point update`
                                : "Cannot update product/ productId not found",
                    }
                });

                redisClient.keys('*products_*', (error, keys) => {
                    if (error) {
                        console.error('Error retrieving keys:', error);
                        return;
                    }
                    // Delete each key individually
                    keys.forEach((key) => {
                        redisClient.del(key, (deleteError, reply) => {
                            if (deleteError) {
                                console.error(`Error deleting key ${key}:`, deleteError);
                            } else {
                                console.log(`Key ${key} deleted successfully`);
                            }
                        });
                    });
                });
            }
        } catch (error) {
            reject(error.message);
        }
    });


const deleteProduct = (productId) =>
    new Promise(async (resolve, reject) => {
        try {
            const findProduct = await db.Product.findOne({
                raw: true, nest: true,
                where: { productId: productId },
            });

            if (findProduct.status === "Deactive") {
                resolve({
                    status: 400,
                    data: {
                        msg: "The product already deactive!",
                    }
                });
                return;
            }

            const products = await db.Product.update(
                { status: "Deactive" },
                {
                    where: { productId: productId },
                    individualHooks: true,
                }
            );

            resolve({
                status: products[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        products[0] > 0
                            ? `${products[0]} product delete`
                            : "Cannot delete product/ productId not found",
                }
            });

            redisClient.keys('*products_*', (error, keys) => {
                if (error) {
                    console.error('Error retrieving keys:', error);
                    return;
                }
                // Delete each key individually
                keys.forEach((key) => {
                    redisClient.del(key, (deleteError, reply) => {
                        if (deleteError) {
                            console.error(`Error deleting key ${key}:`, deleteError);
                        } else {
                            console.log(`Key ${key} deleted successfully`);
                        }
                    });
                });
            });

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateProduct,
    deleteProduct,
    createProduct,
    getAllProduct,
    getProductById,
};

