const db = require("../models");
const { Op } = require("sequelize");

const getAllProductCategory = (
    { page, limit, order, productCateName, address, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            const queries = { nest: true };
            const offset = !page || +page <= 1 ? 0 : +page - 1;
            const flimit = +limit || +process.env.LIMIT_POST;
            queries.offset = offset * flimit;
            queries.limit = flimit;
            if (order) queries.order = [[order]]
            else {
                queries.order = [['updatedAt', 'DESC']];
            }
            if (productCateName) query.productCateName = { [Op.substring]: productCateName };
            if (status) query.status = { [Op.eq]: status };
            if (roleName !== "Admin") {
                query.status = { [Op.notIn]: ['Deactive'] };
            }
            const productCates = await db.ProductCategory.findAll({
                where: query,
                ...queries,
            });

            resolve({
                status: productCates ? 200 : 404,
                data: {
                    msg: productCates ? "Got productCates" : "Cannot find productCates",
                    productCates: productCates,
                }
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getProductCategoryById = (productCateId) =>
    new Promise(async (resolve, reject) => {
        try {
            const productCate = await db.ProductCategory.findOne({
                where: { productCateId: productCateId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                }
            });
            resolve({
                status: productCate ? 200 : 404,
                data: {
                    msg: productCate ? "Got productCate" : `Cannot find productCate with id: ${productCateId}`,
                    productCate: productCate,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createProductCategory = ({ productCateName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createProductCategory = await db.ProductCategory.findOrCreate({
                where: {
                    productCateName: productCateName
                },
                defaults: {
                    productCateName: productCateName,
                    ...body,
                },
            });

            resolve({
                status: createProductCategory[1] ? 200 : 400,
                data: {
                    msg: createProductCategory[1]
                        ? "Create new productCate successfully"
                        : "Cannot create new productCate/ProductCategory name already exists",
                    productCate: createProductCategory[1] ? createProductCategory[0].dataValues : null,
                }
            });

        } catch (error) {
            reject(error);
        }
    });

const updateProductCategory = ({ productCateId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const productCate = await db.ProductCategory.findOne({
                where: {
                    productCateName: body?.productCateName,
                    productCateId: {
                        [Op.ne]: productCateId
                    }
                }
            })

            if (productCate !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "ProductCategory name already exists"
                    }
                });
            } else {
                const productCates = await db.ProductCategory.update(body, {
                    where: { productCateId },
                    individualHooks: true,
                });

                resolve({
                    status: productCates[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            productCates[1].length !== 0
                                ? `Product Cate update`
                                : "Cannot update productCate/ productCateId not found",
                    }
                });
            }

        } catch (error) {
            reject(error.message);
        }
    });


const deleteProductCategory = (productCateIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findProductCategory = await db.ProductCategory.findAll({
                raw: true, nest: true,
                where: { productCateId: productCateIds },
            });

            for (const productCate of findProductCategory) {
                if (productCate.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The productCate already deactive!",
                        }
                    });
                    return;
                }
            }

            const productCates = await db.ProductCategory.update(
                { status: "Deactive" },
                {
                    where: { productCateId: productCateIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: productCates[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        productCates[0] > 0
                            ? `${productCates[0]} productCate delete`
                            : "Cannot delete productCate/ productCateId not found",
                }
            });

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateProductCategory,
    deleteProductCategory,
    createProductCategory,
    getAllProductCategory,
    getProductCategoryById
};

