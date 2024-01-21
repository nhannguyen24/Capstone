const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum");
const { StatusCodes } = require("http-status-codes");

const getAllPointOfInterest = (
    { page, limit, order, poiName, address, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, async (error, poi) => {
                if (poi != null && poi != "" && roleName != 'Admin') {
                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: "Got pois",
                            pois: JSON.parse(poi),
                        }
                    });
                } else {
                    redisClient.get(`admin_pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, async (error, adminPointOfInterest) => {
                        if (adminPointOfInterest != null && adminPointOfInterest != "") {
                            resolve({
                                status: StatusCodes.OK,
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
                                ]
                            });

                            for (const point of pois) {
                                const soundOfPoint = await db.FileSound.findAll({
                                    nest: true, 
                                    where: {
                                        status: { [Op.ne]: STATUS.DEACTIVE },
                                        poiId: point.poiId
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
                                })

                                point.dataValues.poi_sound = soundOfPoint;
                            }

                            if (roleName !== "Admin") {
                                redisClient.setEx(`pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, 3600, JSON.stringify(pois));
                            } else {
                                redisClient.setEx(`admin_pois_${page}_${limit}_${order}_${poiName}_${address}_${status}`, 3600, JSON.stringify(pois));
                            }
                            
                            resolve({
                                status: StatusCodes.OK,
                                data: {
                                    msg: pois.length > 0  ? "Got pois" : "Cannot find pois",
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
                ]
            });

            for (const point of poi) {
                const soundOfPoint = await db.FileSound.findAll({
                    nest: true, 
                    where: {
                        status: { [Op.ne]: STATUS.DEACTIVE },
                        poiId: point.poiId
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
                })

                point.dataValues.poi_sound = soundOfPoint;
            }
            
            resolve({
                status: poi ? StatusCodes.OK : StatusCodes.NOT_FOUND,
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
            const [createPointOfInterest, created] = await db.PointOfInterest.findOrCreate({
                where: {
                    poiName: poiName
                },
                defaults: {
                    poiName: poiName,
                    ...body,
                },
            });

            if (created && images) {
                const createImagePromises = images.map(async (image) => {
                    await db.Image.create({
                        image: image,
                        poiId: createPointOfInterest.poiId,
                    });
                });

                await Promise.all(createImagePromises);
            }
            if (created) {
                await  db.FileSound.create({
                    file: 'https://storage.googleapis.com/wallet-fpt.appspot.com/English.mp3?GoogleAccessId=firebase-adminsdk-9ejw2%40wallet-fpt.iam.gserviceaccount.com&Expires=1716163200&Signature=MTq%2F8aAx4p%2Ft20OCtUOG9zV7ejYdVVl5yam5vBEBSaV5rCuCYe8Fh%2FwEl5peLE36DwdLVkFcygrg%2B3ocgi%2FJZocP56aL%2BXzas3LNt7ovuCjf7P0Nx1g5nRzRppKd30S%2FCrB1AQt5eJ1mH6Ojz0DRT5HXbwdzv6%2F%2BOy4ykrt6CpFFC86%2BXbJ8ywvZ%2BggO%2FbdWbDggsmhKMhG%2B%2BQKdmMyXLWPvYW1proVIDdkncW49TpAjq9UvKRDk0jXTKw%2FNp2POlkts9wUxl6seCnuHc%2FTypikcvzZUfj2sY7InDtThDhHnNgDAPpy2nFksnUdsoZqAreDVEzSCIETyYK7gz5xwaw%3D%3D',
                    poiId: createPointOfInterest.poiId,
                    languageId: '30536f3a-7365-4a7a-a76f-2b13f140861c'
                });
            }

            resolve({
                status: created ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                data: {
                    msg: created
                        ? "Create new poi successfully"
                        : "Cannot create new poi/Point name already exists",
                    poi: created ? createPointOfInterest.dataValues : null,
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
                    status: StatusCodes.CONFLICT,
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
                    status: pois[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
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
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: "The point of interest already deactive!",
                    }
                });
                return;
            }

            const findRoute = await db.RoutePointDetail.findOne({
                raw: true,
                where: {
                    poiId: id,
                    status: STATUS.ACTIVE,
                  }
            });

            if (findRoute) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: "Cannot delete this point of interest! There is route using this point of interest!",
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
                status: pois[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
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

