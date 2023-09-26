const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllRoute = (
    { page, limit, order, routeName, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`routes_${page}_${limit}_${order}_${routeName}_${status}`, async (error, route) => {
                if (error) console.error(error);
                if (route != null && route != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got routes",
                            routes: JSON.parse(route),
                        }
                    });
                } else {
                    redisClient.get(`admin_routes_${page}_${limit}_${order}_${routeName}_${status}`, async (error, adminRoute) => {
                        if (adminRoute != null && adminRoute != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got routes",
                                    routes: JSON.parse(adminRoute),
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
                                // queries.order = [['updatedAt', 'DESC']];
                                queries.order = [
                                    ['updatedAt', 'DESC'],
                                    [{ model: db.RouteDetail, as: 'route_detail' }, 'index', 'ASC'],
                                    [{ model: db.RouteDetail, as: 'route_detail' }, { model: db.Step, as: 'route_detail_step' }, 'index', 'ASC'],
                                    [{ model: db.RoutePointDetail, as: 'route_poi_detail' }, 'index', 'ASC']
                                ];
                            }
                            if (routeName) query.routeName = { [Op.substring]: routeName };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const routes = await db.Route.findAll({
                                where: query,
                                ...queries,
                                include: [
                                    {
                                        model: db.RouteDetail,
                                        as: "route_detail",
                                        attributes: {
                                            exclude: [
                                                "routeId",
                                                "stationId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.Station,
                                                as: "route_detail_station",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                            {
                                                model: db.Step,
                                                as: "route_detail_step",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                        ]
                                    },
                                    {
                                        model: db.RoutePointDetail,
                                        as: "route_poi_detail",
                                        attributes: {
                                            exclude: [
                                                "routeId",
                                                "poiId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.PointOfInterest,
                                                as: "route_poi_detail_poi",
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
                                ],
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`routes_${page}_${limit}_${order}_${routeName}_${status}`, 3600, JSON.stringify(routes));
                            } else {
                                redisClient.setEx(`admin_routes_${page}_${limit}_${order}_${routeName}_${status}`, 3600, JSON.stringify(routes));
                            }
                            resolve({
                                status: routes ? 200 : 404,
                                data: {
                                    msg: routes ? "Got routes" : "Cannot find routes",
                                    routes: routes,
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

const getRouteById = (routeId) =>
    new Promise(async (resolve, reject) => {
        try {
            const route = await db.Route.findAll({
                where: { routeId: routeId },
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                order: [
                    ['updatedAt', 'DESC'],
                    [{ model: db.RouteDetail, as: 'route_detail' }, 'index', 'ASC'],
                    [{ model: db.RouteDetail, as: 'route_detail' }, { model: db.Step, as: 'route_detail_step' }, 'index', 'ASC'],
                    [{ model: db.RoutePointDetail, as: 'route_poi_detail' }, 'index', 'ASC']
                ],
                include: [
                    {
                        model: db.RouteDetail,
                        as: "route_detail",
                        attributes: {
                            exclude: [
                                "routeId",
                                "stationId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.Station,
                                as: "route_detail_station",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.Step,
                                as: "route_detail_step",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                        ]
                    },
                    {
                        model: db.RoutePointDetail,
                        as: "route_poi_detail",
                        attributes: {
                            exclude: [
                                "routeId",
                                "poiId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.PointOfInterest,
                                as: "route_poi_detail_poi",
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
                ],
            });
            resolve({
                status: route ? 200 : 404,
                data: {
                    msg: route ? "Got route" : `Cannot find route with id: ${routeId}`,
                    route: route,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createRoute = ({ routeName, ...body }) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const createRoute = await db.Route.findOrCreate({
                    where: {
                        routeName: routeName
                    },
                    defaults: {
                        routeName: routeName,
                        distance: body.distance
                    },
                    transaction: t,
                });

                if (!createRoute[1]) {
                    return resolve({
                        status: 400,
                        data: {
                            msg: "Cannot create new route/Route name already exists"
                        }
                    })
                }

                let index = 0;
                let pointIndex = 0;
                let stepIndex = 0;

                const stationDetails = await Promise.all(
                    body.station.map(async (stationObj) => {
                        index += 1;
                        const routeDetail = await db.RouteDetail.create(
                            {
                                index: index,
                                routeId: createRoute[0].dataValues.routeId,
                                stationId: stationObj.stationId,
                                stopoverTime: stationObj.stopoverTime,
                            },
                            { transaction: t }
                        );

                        if (stationObj.step && Array.isArray(stationObj.step)) {
                            stationObj.step.map(async (stepObj) => {
                                stepIndex += 1;
                                await db.Step.create(
                                    {
                                        index: stepIndex,
                                        routeDetailId: routeDetail.dataValues.routeDetailId,
                                        latitude: stepObj.latitude,
                                        longitude: stepObj.longitude,
                                    },
                                    { transaction: t }
                                );
                            })
                        }

                        return routeDetail;
                    })
                );

                const pointDetails = await Promise.all(
                    body.point.map(async (pointObj) => {
                        pointIndex += 1;
                        const stationDetail = await db.RoutePointDetail.create(
                            {
                                index: pointIndex,
                                routeId: createRoute[0].dataValues.routeId,
                                poiId: pointObj,
                            },
                            { transaction: t }
                        );
                        return stationDetail;
                    })
                );

                resolve({
                    status: pointDetails[0] ? 200 : 400,
                    data: {
                        msg: pointDetails[0]
                            ? "Create new route successfully"
                            : "Cannot create new route",
                        routeDetail: pointDetails[0] ? createRoute[0].dataValues : null,
                    }
                });


                redisClient.keys('*routes_*', (error, keys) => {
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
                await t.commit();
            });

        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
            reject(error);
        }
    });

const updateRoute = ({ routeId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const route = await db.Route.findOne({
                where: {
                    routeName: body?.routeName,
                    routeId: {
                        [Op.ne]: routeId
                    }
                }
            })

            if (route !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Route name already exists"
                    }
                });
            } else {
                const routes = await db.Route.update(body, {
                    where: { routeId },
                    individualHooks: true,
                });

                resolve({
                    status: routes[0] > 0 ? 200 : 400,
                    data: {
                        msg:
                            routes[0] > 0
                                ? `${routes[0]} route update`
                                : "Cannot update route/ routeId not found",
                    }
                });

                redisClient.keys('*routes_*', (error, keys) => {
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


const deleteRoute = (routeIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findRoute = await db.Route.findAll({
                raw: true, nest: true,
                where: { routeId: routeIds },
            });

            for (const route of findRoute) {
                if (route.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The route already deactive!",
                        }
                    });
                }
            }

            const routes = await db.Route.update(
                { status: "Deactive" },
                {
                    where: { routeId: routeIds },
                    individualHooks: true,
                }
            );

            resolve({
                status: routes[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        routes[0] > 0
                            ? `${routes[0]} route delete`
                            : "Cannot delete route/ routeId not found",
                }
            });

            redisClient.keys('*routes_*', (error, keys) => {
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
    updateRoute,
    deleteRoute,
    createRoute,
    getAllRoute,
    getRouteById
};

