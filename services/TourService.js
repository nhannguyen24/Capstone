const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]

const getAllTour = (
    { page, limit, order, tourName, address, tourStatus, status, routeId, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}`, async (error, tour) => {
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
                        queries.order = [
                            ['updatedAt', 'DESC'],
                        ];
                    }
                    if (tourName) query.tourName = { [Op.substring]: tourName };
                    if (tourStatus) query.tourStatus = { [Op.eq]: tourStatus };
                    if (routeId) query.routeId = { [Op.eq]: routeId };
                    if (status) query.status = { [Op.eq]: status };

                    const tours = await db.Tour.findAll({
                        where: query,
                        ...queries,
                        attributes: {
                            exclude: [
                                "routeId",
                                "departureStationId",
                                "busId",
                                "tourGuideId",
                                "driverId",
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
                                model: db.Bus,
                                as: "tour_bus",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.User,
                                as: "tour_tourguide",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.User,
                                as: "tour_driver",
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
                                        "tourId",
                                        "ticketTypeId",
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
                                    }
                                ]
                            },
                        ]
                    });

                    for (const e of tours) {
                        let day = DAY_ENUM.NORMAL

                        const tourDepartureDate = new Date(e.departureDate)
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

                        for (const ticket of e.tour_ticket) {
                            const price = await db.Price.findOne({
                                where: {
                                    ticketTypeId: ticket.ticket_type.ticketTypeId,
                                    day: day
                                },
                                attributes: {
                                    exclude: [
                                        "ticketTypeId",
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ]
                                }
                            })
                            ticket.dataValues.ticket_type.dataValues.price = price
                        }
                    }

                    redisClient.setEx(`admin_tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}`, 900, JSON.stringify(tours));

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
                    exclude: ["routeId", "departureStationId", "busId", "tourGuideId", "driverId", "createdAt", "updatedAt"],
                },
                order: [
                    ['updatedAt', 'DESC'],
                    [{ model: db.Route, as: 'tour_route' }, { model: db.RouteDetail, as: 'route_detail' }, 'index', 'ASC'],
                    [{ model: db.Route, as: 'tour_route' }, { model: db.RouteDetail, as: 'route_detail' }, { model: db.Step, as: 'route_detail_step' }, 'index', 'ASC'],
                    [{ model: db.Route, as: 'tour_route' }, { model: db.RoutePointDetail, as: 'route_poi_detail' }, 'index', 'ASC']
                ],
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
                        model: db.Bus,
                        as: "tour_bus",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.User,
                        as: "tour_tourguide",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.User,
                        as: "tour_driver",
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
                    },
                    {
                        model: db.Ticket,
                        as: "tour_ticket",
                        attributes: {
                            exclude: [
                                "tourId",
                                "ticketTypeId",
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
                            }
                        ]
                    },
                ]
            });

            for (const e of tour) {
                let day = DAY_ENUM.NORMAL

                const tourDepartureDate = new Date(e.departureDate)
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

                for (const ticket of e.tour_ticket) {
                    const price = await db.Price.findOne({
                        where: {
                            ticketTypeId: ticket.ticket_type.ticketTypeId,
                            day: day
                        },
                        attributes: {
                            exclude: [
                                "ticketTypeId",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ]
                        }
                    })
                    ticket.dataValues.ticket_type.dataValues.price = price
                }
            }

            resolve({
                status: tour.length > 0 ? 200 : 404,
                data: {
                    msg: tour.length > 0 ? "Got tour" : `Cannot find tour with id: ${tourId}`,
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
                            model: db.RouteSegment,
                            as: "route_segment",
                            where: {
                                index: 1
                            }
                        },
                    ]
                });

                if (!station) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Route Id not found"
                        }
                    })
                    return;
                }
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
                            msg: "End booking date must be 12 hours earlier than Departure date",
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
                            departureStationId: station.route_segment.stationId,
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
                                    msg: `Ticket type doesn't have a price for day`,
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
                        if (images) {
                            const createImagePromises = images.map(async (image) => {
                                await db.Image.create({
                                    image: image,
                                    tourId: createTour[0].tourId,
                                }, { transaction: t });
                            });

                            await Promise.all(createImagePromises);
                        }
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
                }
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

const assignTour = () =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 7);

                const findTourActive = await db.Tour.findAll({
                    raw: true, nest: true,
                    order: [['departureDate', 'ASC']],
                    where: {
                        departureDate: {
                            [Op.gte]: currentDate,
                        },
                        status: STATUS.ACTIVE
                    }
                })

                if (findTourActive.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are not tours active'
                        }
                    })
                    return;
                }

                const findBusActive = await db.Bus.findAll({
                    raw: true, nest: true,
                    where: {
                        status: STATUS.ACTIVE
                    }
                })

                if (findBusActive.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are not buses active'
                        }
                    })
                    return;
                }

                const findTourguide = await db.User.findAll({
                    raw: true, nest: true,
                    include: [
                        {
                            model: db.Role,
                            as: "user_role",
                            where: {
                                roleName: 'TourGuide',
                                status: STATUS.ACTIVE,
                            }
                        }
                    ]
                })

                const findDriver = await db.User.findAll({
                    raw: true, nest: true,
                    include: [
                        {
                            model: db.Role,
                            as: "user_role",
                            where: {
                                roleName: 'Driver',
                                status: STATUS.ACTIVE,
                            }
                        }
                    ]
                })

                if (findTourguide.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are not tour guide available'
                        }
                    })
                    return;
                }

                if (findDriver.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are not buses available'
                        }
                    })
                    return;
                }

                // Initialize the schedule
                const findSchedule = await db.Tour.findAll({
                    raw: true, nest: true,
                    where: {
                        status: STATUS.SCHEDULED,
                        tourStatus: TOUR_STATUS.NOT_STARTED
                    },
                    attributes: [
                        "tourId",
                        "tourName",
                        "beginBookingDate",
                        "endBookingDate",
                        "departureDate",
                        "duration",
                        "tourStatus",
                        "status",
                    ],
                    include: [
                        {
                            model: db.Bus,
                            as: "tour_bus",
                            attributes: [
                                "busId"
                            ]
                        },
                        {
                            model: db.User,
                            as: "tour_tourguide",
                            attributes: [
                                "userId"
                            ]
                        },
                        {
                            model: db.User,
                            as: "tour_driver",
                            attributes: [
                                "userId"
                            ]
                        },
                    ]
                })

                const schedule = [];
                if (findSchedule.length > 0) {
                    for (const tour of findSchedule) {
                        const tourGuide = tour.tour_tourguide;
                        const driver = tour.tour_driver;
                        const bus = tour.tour_bus;

                        schedule.push({ tour, tourGuide, driver, bus });
                    }
                }
                for (const tour of findTourActive) {
                    // Find an available employee for the tour
                    const availableTourGuide = findTourguide.filter(
                        (employee) =>
                            employee.maxTour > 0 &&
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);
                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;

                                // Check if the tour guide is available
                                return endDate >= tour.departureDate && assignment.tourGuide.userId == employee.userId
                            })
                    );

                    const availableDriver = findDriver.filter(
                        (employee) =>
                            employee.maxTour > 0
                            // && !employee.driverId == tour.driverId
                            && !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);

                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;
                                return endDate >= tour.departureDate && assignment.driver.userId == employee.userId
                            })
                    );

                    const availableBuses = findBusActive.filter(
                        (bus) =>
                            bus.numberSeat >= 2
                            && !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);

                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;
                                return endDate >= tour.departureDate && assignment.bus.busId == bus.busId
                            })
                    );

                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        const chosenTourGuide = availableTourGuide[0];
                        const chosenDriver = availableDriver[0];
                        chosenTourGuide.maxTour --;
                        chosenDriver.maxTour --;

                        const chosenBus = availableBuses[0];
                        schedule.push({ tour, tourGuide: chosenTourGuide, driver: chosenDriver, bus: chosenBus });
                    }
                }

                const findTourNotScheduled = findTourActive.filter(itemA => !schedule.some(itemB => itemB.tour.tourId === itemA.tourId));

                for (const assignment of schedule) {
                    // console.log(
                    //     `Tour ${assignment.tour.tourId} at ${assignment.tour.departureDate.toISOString()} assigned to ${assignment.tourGuide.userId}, ${assignment.driver.userId} on Bus ${assignment.bus.busId}`
                    // );

                    await db.Tour.update({
                        tourGuideId: assignment.tourGuide.userId,
                        driverId: assignment.driver.userId,
                        busId: assignment.bus.busId,
                        status: STATUS.SCHEDULED,
                    }, {
                        where: { tourId: assignment.tour.tourId },
                        individualHooks: true,
                        transaction: t
                    });

                    await db.User.update({
                        maxTour: assignment.tourGuide.maxTour,
                    }, {
                        where: { userId: assignment.tourGuide.userId },
                        individualHooks: true,
                        transaction: t
                    });

                    await db.User.update({
                        maxTour: assignment.driver.maxTour,
                    }, {
                        where: { userId: assignment.driver.userId },
                        individualHooks: true,
                        transaction: t
                    });

                    resolve({
                        status: 200,
                        data: {
                            msg:
                                findTourNotScheduled.length == 0
                                    ? 'Tours have been scheduled'
                                    : 'Tour name ' + findTourNotScheduled.map(tour => `'${tour.tourName}'`).join(', ') + ' cannot be scheduled'
                        }
                    });
                }
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

const updateTour = ({ images, tourId, ...body }) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
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
                                msg: "End booking date must be 12 hours earlier than Departure date",
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
                            transaction: t
                        });

                        if (images) {
                            await db.Image.destroy({
                                where: {
                                    tourId: tourId,
                                }
                            });

                            const createImagePromises = images.map(async (image) => {
                                await db.Image.create({
                                    image: image,
                                    tourId: tourId,
                                }, { transaction: t });
                            });

                            await Promise.all(createImagePromises);
                        }

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
                await t.commit();
            })
        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
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
                    return;
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
    assignTour,
};

