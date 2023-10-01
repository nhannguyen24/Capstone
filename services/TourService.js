const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]

const getAllTour = (
    { page, limit, order, tourName, address, tourStatus, status, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}`, async (error, tour) => {
                if (error) console.error(error);
                if (tour != null && tour != "") {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got tours",
                            tours: JSON.parse(tour),
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

                    redisClient.setEx(`admin_tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}`, 3600, JSON.stringify(tours));

                    resolve({
                        status: tours ? 200 : 404,
                        data: {
                            msg: tours ? "Got tours" : "Cannot find tours",
                            tours: tours,
                        }
                    });
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

const createTour = ({ images, tickets, tourName, ...body }) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
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
                const currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 7);
                const tDepartureDate = new Date(body.departureDate);
                const tourBeginBookingDate = new Date(body.beginBookingDate);
                const tourEndBookingDate = new Date(body.endBookingDate);

                if (currentDate > tourBeginBookingDate || currentDate.getTime() > tourBeginBookingDate.getTime()) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be earlier than current date"
                        }
                    })
                    return;
                } else if (tourBeginBookingDate >= tourEndBookingDate || tourBeginBookingDate.getTime() >= tourEndBookingDate.getTime()) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be later than End booking date",
                        }
                    });
                    return;
                } else if (tDepartureDate <= tourEndBookingDate || tDepartureDate.getTime() <= tourEndBookingDate.getTime() + 12 * 60 * 60 * 1000) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "End booking date must be 12 hours later than Departure date",
                        }
                    });
                    return;
                } else {
                    const createTour = await db.Tour.findOrCreate({
                        where: {
                            tourName: tourName
                        },
                        defaults: {
                            beginBookingDate: tourBeginBookingDate,
                            endBookingDate: tourEndBookingDate,
                            departureDate: tDepartureDate,
                            tourName: tourName,
                            departureStationId: station.route_detail.stationId,
                            ...body,
                        },
                        transaction: t,
                    });

                    const createTicketPromises = tickets.map(async (ticketTypeId) => {
                        const ticketType = await db.TicketType.findOne({
                            where: {
                                ticketTypeId: ticketTypeId
                            },
                            transaction: t,
                        })

                        if (!ticketType) {
                            resolve({
                                status: 404,
                                data: {
                                    msg: `Ticket type not found with id ${ticketTypeId}`,
                                }
                            })
                        }
                        if (STATUS.DEACTIVE == ticketType.status) {
                            resolve({
                                status: 409,
                                data: {
                                    msg: `Ticket type is "Deactive"`,
                                }
                            })
                        }

                        let day = DAY_ENUM.NORMAL

                        const tourDepartureDate = new Date(createTour[0].departureDate)
                        const dayOfWeek = tourDepartureDate.getDay()
                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                            day = DAY_ENUM.WEEKEND
                        }
                        const date = tourDepartureDate.getDate()
                        const month = tourDepartureDate.getMonth()
                        const dateMonth = `${date}-${month}`
                        if (dateMonth.includes(SPECIAL_DAY)) {
                            day = DAY_ENUM.HOLIDAY
                        }

                        const price = await db.Price.findOne({
                            where: {
                                ticketTypeId: ticketType.ticketTypeId,
                                day: day,
                            }
                        })
                        if (!price) {
                            resolve({
                                status: 409,
                                data: {
                                    msg: `Ticket type doesn't have a price for day: ${tour.departureDate}(${day})`,
                                }
                            })
                        } else {
                            await db.Ticket.findOrCreate({
                                where: {
                                    ticketTypeId: ticketTypeId,
                                    tourId: createTour[0].tourId
                                },
                                defaults: { ticketTypeId: ticketTypeId, tourId: createTour[0].tourId, },
                                transaction: t,
                            });
                            // resolve({
                            //     status: created ? 201 : 400,
                            //     data: {
                            //         msg: created ? `Create ticket successfully for tour: ${tourId}` : `Ticket already exists in tour: ${tourId}`,
                            //         ticket: created ? ticket : {}
                            //     }
                            // });
                        }
                    });
                    await Promise.all(createTicketPromises);

                    if (createTour[1]) {
                        const createImagePromises = images.map(async (image) => {
                            await db.Image.create({
                                image: image,
                                tourId: createTour[0].tourId,
                            }, { transaction: t });
                        });

                        await Promise.all(createImagePromises);

                    }
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
                    await t.commit();
                }
            });
        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
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
                const currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 7);
                const tDepartureDate = new Date(body.departureDate);
                const tourBeginBookingDate = new Date(body.beginBookingDate);
                const tourEndBookingDate = new Date(body.endBookingDate);

                if (currentDate > tourBeginBookingDate || currentDate.getTime() > tourBeginBookingDate.getTime()) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be earlier than current date"
                        }
                    })
                    return;
                } else if (tourBeginBookingDate >= tourEndBookingDate || tourBeginBookingDate.getTime() >= tourEndBookingDate.getTime()) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be later than End booking date",
                        }
                    });
                    return;
                } else if (tDepartureDate <= tourEndBookingDate || tDepartureDate.getTime() <= tourEndBookingDate.getTime() + 12 * 60 * 60 * 1000) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "End booking date must be 12 hours later than Departure date",
                        }
                    });
                    return;
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

                    const tours = await db.Tour.update({ 
                        departureStationId: station.route_detail.stationId, 
                        beginBookingDate: tourBeginBookingDate,
                        endBookingDate: tourEndBookingDate,
                        departureDate: tDepartureDate,
                         ...body 
                        }, {
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
                        status: tours[1].length !== 0 ? 200 : 400,
                        data: {
                            msg:
                                tours[1].length !== 0
                                    ? `Tour update`
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

