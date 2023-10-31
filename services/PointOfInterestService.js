const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")

const getAllPointOfInterest = (
    { page, limit, order, poiName, address, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, async (error, poi) => {
                if (poi != null && poi != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got pois",
                            pois: JSON.parse(poi),
                        }
                    });
                } else {
                    redisClient.get(`admin_pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, async (error, adminPointOfInterest) => {
                        if (adminPointOfInterest != null && adminPointOfInterest != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got pois",
                                    pois: JSON.parse(adminPointOfInterest),
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
                            if (poiName) query.poiName = { [Op.substring]: poiName };
                            if (address) query.address = { [Op.substring]: address };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const pois = await db.PointOfInterest.findAll({
                                where: query,
                                ...queries,
                                include: [
                                    {
                                        model: db.Image,
                                        as: "poi_image",
                                        attributes: {
                                            exclude: [
                                                "poiId",
                                                "busId",
                                                "tourId",
                                                "productId",
                                                "feedbackId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.FileSound,
                                        as: "poi_sound",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        where: {
                                            status: { [Op.ne]: STATUS.DEACTIVE }
                                        },
                                        include: [
                                            {
                                                model: db.Language,
                                                as: "sound_language",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            }
                                        ]
                                    },
                                ]
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, 3600, JSON.stringify(pois));
                            } else {
                                redisClient.setEx(`admin_pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, 3600, JSON.stringify(pois));
                            }
                            resolve({
                                status: pois ? 200 : 404,
                                data: {
                                    msg: pois ? "Got pois" : "Cannot find pois",
                                    pois: pois,
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

const getPointOfInterestById = (poiId) =>
    new Promise(async (resolve, reject) => {
        try {
            const poi = await db.PointOfInterest.findAll({
                where: { poiId: poiId },
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Image,
                        as: "poi_image",
                        attributes: {
                            exclude: [
                                "poiId",
                                "busId",
                                "tourId",
                                "productId",
                                "feedbackId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.FileSound,
                        as: "poi_sound",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        where: {
                            status: { [Op.ne]: STATUS.DEACTIVE }
                        },
                        include: [
                            {
                                model: db.Language,
                                as: "sound_language",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            }
                        ]
                    },
                ]
            });
            resolve({
                status: poi ? 200 : 404,
                data: {
                    msg: poi ? "Got poi" : `Cannot find poi with id: ${poiId}`,
                    poi: poi,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createPointOfInterest = ({ images, poiName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createPointOfInterest = await db.PointOfInterest.findOrCreate({
                where: {
                    poiName: poiName
                },
                defaults: {
                    poiName: poiName,
                    ...body,
                },
            });

            if (images) {
                const createImagePromises = images.map(async (image) => {
                    await db.Image.create({
                        image: image,
                        poiId: createPointOfInterest[0].poiId,
                    });
                });

                await Promise.all(createImagePromises);
            }

            resolve({
                status: createPointOfInterest[1] ? 200 : 400,
                data: {
                    msg: createPointOfInterest[1]
                        ? "Create new poi successfully"
                        : "Cannot create new poi/Point name already exists",
                    poi: createPointOfInterest[1] ? createPointOfInterest[0].dataValues : null,
                }
            });
            redisClient.keys('*pois_*', (error, keys) => {
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

const updatePointOfInterest = (id, { images, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const poi = await db.PointOfInterest.findOne({
                where: {
                    poiName: body?.poiName,
                    poiId: {
                        [Op.ne]: id
                    }
                }
            })

            if (poi !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "PointOfInterest name already exists"
                    }
                });
            } else {
                const pois = await db.PointOfInterest.update(body, {
                    where: { poiId: id },
                    individualHooks: true,
                });

                if (images) {
                    await db.Image.destroy({
                        where: {
                            poiId: id,
                        }
                    });

                    const createImagePromises = images.map(async (image) => {
                        await db.Image.create({
                            image: image,
                            poiId: id,
                        });
                    });

                    await Promise.all(createImagePromises);
                }
                resolve({
                    status: pois[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            pois[1].length !== 0
                                ? `Point update`
                                : "Cannot update point/ poiId not found",
                    }
                });

                redisClient.keys('*pois_*', (error, keys) => {
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


const deletePointOfInterest = (id) =>
    new Promise(async (resolve, reject) => {
        try {
            const findPoint = await db.PointOfInterest.findOne({
                raw: true, nest: true,
                where: { poiId: id },
            });

            if (findPoint.status === "Deactive") {
                resolve({
                    status: 400,
                    data: {
                        msg: "The point of interest already deactive!",
                    }
                });
                return;
            }

            const pois = await db.PointOfInterest.update(
                { status: "Deactive" },
                {
                    where: { poiId: id },
                    individualHooks: true,
                }
            );
            resolve({
                status: pois[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        pois[0] > 0
                            ? `${pois[0]} poi delete`
                            : "Cannot delete poi/ poiId not found",
                }
            });

            redisClient.keys('*pois_*', (error, keys) => {
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
    updatePointOfInterest,
    deletePointOfInterest,
    createPointOfInterest,
    getAllPointOfInterest,
    getPointOfInterestById,
};

