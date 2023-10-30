const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllRoute = (
    { page, limit, order, routeName, status, tour, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`routes_${page}_${limit}_${order}_${routeName}_${status}_${tour}`, async (error, route) => {
                if (route != null && route != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got routes",
                            routes: JSON.parse(route),
                        }
                    });
                } else {
                    redisClient.get(`admin_routes_${page}_${limit}_${order}_${routeName}_${status}_${tour}`, async (error, adminRoute) => {
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
                            if (routeName) query.routeName = { [Op.substring]: routeName };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }

                            if (tour == 'true') {
                                queries.include = [
                                    {
                                        model: db.Tour,
                                        as: "route_tour",
                                        attributes: {
                                            exclude: [
                                                "routeId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    }
                                ]

                                if (order) queries.order = [[order]]
                            }
                            else {
                                // queries.order = [['updatedAt', 'DESC']];
                                queries.include = [
                                    {
                                        model: db.RouteSegment,
                                        as: "route_segment",
                                        attributes: {
                                            exclude: [
                                                "routeId",
                                                "departureStationId",
                                                "endStationId",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.Station,
                                                as: "segment_departure_station",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                            {
                                                model: db.Station,
                                                as: "segment_end_station",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                            {
                                                model: db.RoutePointDetail,
                                                as: "segment_route_poi_detail",
                                                attributes: {
                                                    exclude: [
                                                        "routeSegmentId",
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
                                                        include: [
                                                            {
                                                                model: db.FileSound,
                                                                as: "poi_sound",
                                                                attributes: {
                                                                    exclude: [
                                                                        "languageId",
                                                                        "poiId",
                                                                        "createdAt",
                                                                        "updatedAt",
                                                                        "status",
                                                                    ],
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
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                        ]
                                    },
                                ];

                                if (order) queries.order = [[order]]
                                else {
                                    // queries.order = [['updatedAt', 'DESC']];
                                    queries.order = [
                                        ['updatedAt', 'DESC'],
                                        [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                                        [{ model: db.RouteSegment, as: 'route_segment' }, { model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                                    ];
                                }
                            }

                            const routes = await db.Route.findAll({
                                where: query,
                                ...queries,
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`routes_${page}_${limit}_${order}_${routeName}_${status}_${tour}`, 3600, JSON.stringify(routes));
                            } else {
                                redisClient.setEx(`admin_routes_${page}_${limit}_${order}_${routeName}_${status}_${tour}`, 3600, JSON.stringify(routes));
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
                    [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                    [{ model: db.RouteSegment, as: 'route_segment' }, { model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                ],
                include: [
                    {
                        model: db.RouteSegment,
                        as: "route_segment",
                        attributes: {
                            exclude: [
                                "routeId",
                                "departureStationId",
                                "endStationId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.Station,
                                as: "segment_departure_station",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.Station,
                                as: "segment_end_station",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.RoutePointDetail,
                                as: "segment_route_poi_detail",
                                attributes: {
                                    exclude: [
                                        "routeSegmentId",
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
                                        include: [
                                            {
                                                model: db.FileSound,
                                                as: "poi_sound",
                                                attributes: {
                                                    exclude: [
                                                        "languageId",
                                                        "poiId",
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
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
                                            }
                                        ]
                                    }
                                ]
                            },
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
                for (const segmentObj of body.segments) {
                    const findDepartureStation = await db.Station.findOne({
                        where: {
                            stationId: segmentObj.departureStationId,
                        },
                    });

                    if (!findDepartureStation) {
                        return resolve({
                            status: 400,
                            data: {
                                msg: "Departure station Id not found!",
                            },
                        });
                    }

                    const findEndStation = await db.Station.findOne({
                        where: {
                            stationId: segmentObj.endStationId,
                        },
                    });

                    if (!findEndStation) {
                        return resolve({
                            status: 400,
                            data: {
                                msg: "End station Id not found!",
                            },
                        });
                    }

                    if (segmentObj.points && Array.isArray(segmentObj.points)) {
                        for (const pointObj of segmentObj.points) {
                            const findPoint = await db.PointOfInterest.findOne({
                                where: {
                                    poiId: pointObj,
                                },
                            });

                            if (!findPoint) {
                                return resolve({
                                    status: 400,
                                    data: {
                                        msg: "Point of interest Id not found!",
                                    },
                                });
                            }
                        }
                    }
                }

                const createRoute = await db.Route.findOrCreate({
                    where: {
                        routeName: routeName
                    },
                    defaults: {
                        routeName: routeName,
                        distance: body.distance,
                        geoJson: body.geoJson
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

                let segmentIndex = 0;
                for (const segmentObj of body.segments) {
                    let pointIndex = 0;
                    segmentIndex += 1;
                    const routeSegment = await db.RouteSegment.create(
                        {
                            index: segmentIndex,
                            routeId: createRoute[0].dataValues.routeId,
                            distance: segmentObj.distance,
                            departureStationId: segmentObj.departureStationId,
                            endStationId: segmentObj.endStationId,
                        },
                        { transaction: t }
                    );

                    // console.log('oooo', routeSegment);
                    if (segmentObj.points && Array.isArray(segmentObj.points)) {
                        for (const pointObj of segmentObj.points) {
                            pointIndex += 1;
                            await db.RoutePointDetail.create(
                                {
                                    index: pointIndex,
                                    poiId: pointObj,
                                    routeSegmentId: routeSegment.routeSegmentId,
                                },
                                { transaction: t }
                            );
                        }
                    }
                }

                resolve({
                    status: 200,
                    data: {
                        msg: "Create new route successfully",
                        routeDetail: createRoute[0].dataValues,
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

            });

        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback(); // Attempt to roll back the transaction if an error occurs
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            reject(error); // Reject the promise with the error
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
                    status: routes[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            routes[1].length !== 0
                                ? `Route update`
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


const deleteRoute = (routeId) =>
    new Promise(async (resolve, reject) => {
        try {
            const findRoute = await db.Route.findOne({
                raw: true, nest: true,
                where: { routeId: routeId },
            });

            if (findRoute.status === "Deactive") {
                resolve({
                    status: 400,
                    data: {
                        msg: "The route already deactive!",
                    }
                });
                return;
            }

            const routes = await db.Route.update(
                { status: "Deactive" },
                {
                    where: { routeId: routeId },
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

