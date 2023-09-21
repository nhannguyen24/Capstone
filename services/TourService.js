const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllTour = (
    { page, limit, order, tourName, address, tourStatus, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}`, async (error, tour) => {
                if (error) console.error(error);
                if (tour != null && tour != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got tours",
                            tours: JSON.parse(tour),
                        }
                    });
                } else {
                    redisClient.get(`admin_tours_${page}_${limit}_${order}_${tourStatus}_${status}`, async (error, adminTour) => {
                        if (adminTour != null && adminTour != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got tours",
                                    tours: JSON.parse(adminTour),
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
                            if (tourName) query.tourName = { [Op.substring]: tourName };
                            if (tourStatus) query.tourStatus = { [Op.eq]: tourStatus };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const tours = await db.Tour.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: [
                                        "routeId",
                                        "departureStationId",
                                    ],
                                },
                                include: [
                                    {
                                        model: db.Image,
                                        as: "tour_image",
                                        attributes: {
                                            exclude: [
                                                "tourId",
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
                                    },
                                    {
                                        model: db.Station,
                                        as: "departure_station",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.Route,
                                        as: "tour_route",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.Ticket,
                                        as: "tour_ticket",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.TicketType,
                                                as: "ticket_type",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                                include: [
                                                    {
                                                        model: db.Price,
                                                        as: "ticket_type_price",
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
                                    },
                                ]
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}`, 3600, JSON.stringify(tours));
                            } else {
                                redisClient.setEx(`admin_tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}`, 3600, JSON.stringify(tours));
                            }
                            resolve({
                                status: tours ? 200 : 404,
                                data: {
                                    msg: tours ? "Got tours" : "Cannot find tours",
                                    tours: tours,
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

const getTourById = (tourId) =>
    new Promise(async (resolve, reject) => {
        try {
            const tour = await db.Tour.findAll({
                where: { tourId: tourId },
                nest: true,
                attributes: {
                    exclude: ["routeId", "departureStationId", "createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Image,
                        as: "tour_image",
                        attributes: {
                            exclude: [
                                "tourId",
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
                    },
                    {
                        model: db.Station,
                        as: "departure_station",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.Route,
                        as: "tour_route",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    }
                ]
            });
            resolve({
                status: tour ? 200 : 404,
                data: {
                    msg: tour ? "Got tour" : `Cannot find tour with id: ${tourId}`,
                    tour: tour,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createTour = ({ images, tourName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const station = await db.Route.findOne({
                raw: true,
                nest: true,
                where: {
                    routeId: body.routeId
                },
                include: [
                    {
                        model: db.RouteDetail,
                        as: "route_detail",
                        where: {
                            index: 1
                        }
                    },
                ]
            });
            // console.log(station.route_detail.routeDetailId);

            const createTour = await db.Tour.findOrCreate({
                where: {
                    tourName: tourName
                },
                defaults: {
                    tourName: tourName,
                    departureStationId: station.route_detail.stationId,
                    ...body,
                },
            });

            const createImagePromises = images.map(async (image) => {
                await db.Image.create({
                    image: image,
                    tourId: createTour[0].tourId,
                });
            });

            await Promise.all(createImagePromises);

            resolve({
                status: createTour[1] ? 200 : 400,
                data: {
                    msg: createTour[1]
                        ? "Create new tour successfully"
                        : "Cannot create new tour/Tour name already exists",
                    tour: createTour[1] ? createTour[0].dataValues : null,
                }
            });
            redisClient.keys('*tours_*', (error, keys) => {
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

const updateTour = ({ images, tourId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const tour = await db.Tour.findOne({
                where: {
                    tourName: body?.tourName,
                    tourId: {
                        [Op.ne]: tourId
                    }
                }
            })

            if (tour !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Tour name already exists"
                    }
                });
            } else {
                const station = await db.Route.findOne({
                    raw: true,
                    nest: true,
                    where: {
                        routeId: body.routeId
                    },
                    include: [
                        {
                            model: db.RouteDetail,
                            as: "route_detail",
                            where: {
                                index: 1
                            }
                        },
                    ]
                });

                const tours = await db.Tour.update({departureStationId: station.route_detail.stationId, ...body}, {
                    where: { tourId },
                    individualHooks: true,
                });

                await db.Image.destroy({
                    where: {
                        tourId: tourId,
                    }
                });

                const createImagePromises = images.map(async (image) => {
                    await db.Image.create({
                        image: image,
                        tourId: tourId,
                    });
                });

                await Promise.all(createImagePromises);

                resolve({
                    status: tours[0] > 0 ? 200 : 400,
                    data: {
                        msg:
                            tours[0] > 0
                                ? `${tours[0]} tour update`
                                : "Cannot update tour/ tourId not found",
                    }
                });

                redisClient.keys('*tours_*', (error, keys) => {
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


const deleteTour = (tourIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findPonit = await db.Tour.findAll({
                raw: true, nest: true,
                where: { tourId: tourIds },
            });

            for (const tournt of findPonit) {
                if (tournt.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The tour already deactive!",
                        }
                    });
                }
            }

            const tours = await db.Tour.update(
                { status: "Deactive" },
                {
                    where: { tourId: tourIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: tours[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        tours[0] > 0
                            ? `${tours[0]} tour delete`
                            : "Cannot delete tour/ tourId not found",
                }
            });

            redisClient.keys('*tours_*', (error, keys) => {
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
    updateTour,
    deleteTour,
    createTour,
    getAllTour,
    getTourById,
};

