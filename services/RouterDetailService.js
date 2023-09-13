const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const createRouteDetail = ({ routeName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            await db.sequelize.transaction(async (transaction) => {
                const createRoute = await db.Route.findOrCreate({
                    where: {
                        routeName: routeName
                    },
                    defaults: {
                        routeName: routeName,
                        ...body,
                    },
                }, { transaction });

                if (!createRoute[1]) {
                    return resolve({
                        status: 400,
                        data: {
                            msg: "Cannot create new route/Route name already exists"
                        }
                    })
                }

                const combinedArray = body.station.map((stationObj, index) => ({
                    stationId: stationObj.stationId,
                    poiId: body.poi[index].poiId,
                }));

                const createRouteDetail = await Promise.all(
                    combinedArray.map(async (detailObj) => {
                        const { stationId, poiId } = detailObj;
                        const poiDetail = await db.RouteDetail.create(
                            {
                                routeId: createRoute[0].dataValues.routeId,
                                stationId: stationId, // Set the stationId from the object
                                poiId: poiId, // Set the poiId from the object
                            },
                            { transaction }
                        );
                        return poiDetail;
                    })
                );

                resolve({
                    status: createRouteDetail[1] ? 200 : 400,
                    data: {
                        msg: createRouteDetail[1]
                            ? "Create new route successfully"
                            : "Cannot create new route",
                        routeDetail: createRouteDetail[0].dataValues ? routeDetail : null,
                    }
                });
            })
        } catch (error) {
            reject(error);
        }
    });

const updateRouteDetail = ({ routeDetailId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const routeDetail = await db.RouteDetail.findOne({
                where: {
                    routeDetailName: body?.routeDetailName,
                    routeDetailId: {
                        [Op.ne]: routeDetailId
                    }
                }
            })

            if (routeDetail !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "RouteDetail name already exists"
                    }
                });
            } else {
                const routeDetails = await db.RouteDetail.update(body, {
                    where: { routeDetailId },
                    individualHooks: true,
                });

                resolve({
                    status: routeDetails[0] > 0 ? 200 : 400,
                    data: {
                        msg:
                            routeDetails[0] > 0
                                ? `${routeDetails[0]} routeDetail update`
                                : "Cannot update routeDetail/ routeDetailId not found",
                    }
                });

                redisClient.keys('*routeDetails_*', (error, keys) => {
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


const deleteRouteDetail = (routeDetailIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findRouteDetail = await db.RouteDetail.findAll({
                raw: true, nest: true,
                where: { routeDetailId: routeDetailIds },
            });

            for (const routeDetail of findRouteDetail) {
                if (routeDetail.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The routeDetail already deactive!",
                        }
                    });
                }
            }

            const routeDetails = await db.RouteDetail.update(
                { status: "Deactive" },
                {
                    where: { routeDetailId: routeDetailIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: routeDetails > 0 ? 200 : 400,
                data: {
                    msg:
                        routeDetails > 0
                            ? `${routeDetails} routeDetail delete`
                            : "Cannot delete routeDetail/ routeDetailId not found",
                }
            });

            redisClient.keys('*routeDetails_*', (error, keys) => {
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
    updateRouteDetail,
    deleteRouteDetail,
    createRouteDetail
};
