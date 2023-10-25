const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const readXlsxFile = require('read-excel-file/node')
const { BadRequestError } = require('../errors/Index');
const getAllTour = (
    { page, limit, order, tourName, address, tourStatus, status, routeId, tourGuideId, driverId, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}`, async (error, tour) => {
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
                    if (tourGuideId) query.tourGuideId = { [Op.eq]: tourGuideId };
                    if (driverId) query.driverId = { [Op.eq]: driverId };

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
                                attributes: [
                                    "userId",
                                    "userName",
                                    "email",
                                    "avatar",
                                    "phone",
                                ],
                            },
                            {
                                model: db.User,
                                as: "tour_driver",
                                attributes: [
                                    "userId",
                                    "userName",
                                    "email",
                                    "avatar",
                                    "phone",
                                ],
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
                                                    }
                                                ]
                                            },
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

                    for (const tour of tours) {
                        let day = DAY_ENUM.NORMAL

                        const tourDepartureDate = new Date(tour.departureDate)
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

                        for (const ticket of tour.tour_ticket) {
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

                        const departureDate = new Date(tour.departureDate);
                        // Split the duration string into hours, minutes, and seconds
                        const [hours, minutes, seconds] = tour.duration.split(':').map(Number);

                        // Add the duration to the departureDate
                        departureDate.setHours(departureDate.getHours() + hours);
                        departureDate.setMinutes(departureDate.getMinutes() + minutes);
                        departureDate.setSeconds(departureDate.getSeconds() + seconds);
                        // Now, departureDate holds the endTime
                        const endDate = departureDate.toISOString();
                        tour.dataValues.endDate = endDate;
                    }

                    redisClient.setEx(`admin_tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}`, 900, JSON.stringify(tours));

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
            ;
            reject(error);
        }
    });

const getTourById = (tourId) =>
    new Promise(async (resolve, reject) => {
        try {
            const tours = await db.Tour.findAll({
                where: { tourId: tourId },
                nest: true,
                attributes: {
                    exclude: ["routeId", "departureStationId", "busId", "tourGuideId", "driverId", "createdAt", "updatedAt"],
                },
                order: [
                    ['updatedAt', 'DESC'],
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
                        attributes: [
                            "userId",
                            "userName",
                            "email",
                            "avatar",
                            "phone",
                        ],
                    },
                    {
                        model: db.User,
                        as: "tour_driver",
                        attributes: [
                            "userId",
                            "userName",
                            "email",
                            "avatar",
                            "phone",
                        ],
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
                                            }
                                        ]
                                    },
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

            for (const tour of tours) {
                let day = DAY_ENUM.NORMAL

                const tourDepartureDate = new Date(tour.departureDate)
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

                for (const ticket of tour.tour_ticket) {
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

                const departureDate = new Date(tour.departureDate);
                // Split the duration string into hours, minutes, and seconds
                const [hours, minutes, seconds] = tour.duration.split(':').map(Number);

                // Add the duration to the departureDate
                departureDate.setHours(departureDate.getHours() + hours);
                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                // Now, departureDate holds the endTime
                const endDate = departureDate.toISOString();
                tour.dataValues.endDate = endDate;
            }

            resolve({
                status: tours.length > 0 ? 200 : 404,
                data: {
                    msg: tours.length > 0 ? "Got tour" : `Cannot find tour with id: ${tourId}`,
                    tour: tours,
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
            const station = await db.Route.findAll({
                raw: true,
                nest: true,
                order: [
                    [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                ],
                where: {
                    routeId: body.routeId
                },
                include: [
                    {
                        model: db.RouteSegment,
                        as: "route_segment",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
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

            const uniqueStationArray = [];

            // Loop through the JSON data and add station IDs to the array
            station.forEach(item => {
                if (!uniqueStationArray.includes(item.route_segment.departureStationId)) {
                    uniqueStationArray.push(item.route_segment.departureStationId);
                }
                if (uniqueStationArray.includes(item.route_segment.endStationId)) {
                    uniqueStationArray.push(item.route_segment.endStationId);
                }
            });

            // console.log(station);
            // console.log('ok', uniqueStationArray);

                // console.log(station.route_detail.routeDetailId);
                const currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 7);
                const tDepartureDate = new Date(body.departureDate);
                const tourBeginBookingDate = new Date(body.beginBookingDate);
                const tourEndBookingDate = new Date(body.endBookingDate);

                if (currentDate > tourBeginBookingDate) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be earlier than current date"
                        }
                    })
                    return;
                } else if (tourBeginBookingDate >= tourEndBookingDate) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Begin booking date can't be later than End booking date",
                        }
                    });
                    return;
                } else if (tourEndBookingDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "End booking date must be 24 hours earlier than Departure date",
                        }
                    });
                    return;
                } else {
                    const currentDate = new Date();
                    currentDate.setHours(currentDate.getHours() + 7);
                    // Initialize the schedule
                    const findScheduledTour = await db.Tour.findAll({
                        raw: true, nest: true,
                        order: [['departureDate', 'ASC']],
                        where: {
                            departureDate: {
                                [Op.gte]: currentDate,
                            },
                            isScheduled: true,
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
                            "isScheduled"
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
                                msg: 'There are no buses active'
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
                                msg: 'There are no tour guide available'
                            }
                        })
                        return;
                    }

                    if (findDriver.length == 0) {
                        resolve({
                            status: 400,
                            data: {
                                msg: 'There are no driver available'
                            }
                        })
                        return;
                    }

                    const schedule = [];
                    if (findScheduledTour.length > 0) {
                        for (const tour of findScheduledTour) {
                            const tourGuide = tour.tour_tourguide;
                            const driver = tour.tour_driver;
                            const bus = tour.tour_bus;

                            schedule.push({ tour, tourGuide, driver, bus });
                        }
                    }

                    // console.log(tour);
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
                                return endDate >= body.departureDate && assignment.tourGuide.userId == employee.userId
                            })
                    );
                    const availableDriver = findDriver.filter(
                        (employee) =>
                            employee.maxTour > 0
                            && !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);

                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;
                                return endDate >= body.departureDate && assignment.driver.userId == employee.userId
                            })
                    );

                    const availableBuses = findBusActive.filter(
                        (bus) =>
                            // bus.numberSeat >= 2 && 
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);

                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;
                                // console.log(`${bus.busPlate} + ${assignment.tour.tourName}`, endDate >= tour.departureDate);
                                return endDate >= body.departureDate && assignment.bus.busId == bus.busId
                            })
                    );

                    let createTour;
                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        const chosenTourGuide = availableTourGuide[0];
                        const chosenDriver = availableDriver[0];
                        chosenTourGuide.maxTour--;
                        chosenDriver.maxTour--;

                        const chosenBus = availableBuses[0];

                        createTour = await db.Tour.findOrCreate({
                            where: {
                                tourName: tourName
                            },
                            defaults: {
                                beginBookingDate: tourBeginBookingDate,
                                endBookingDate: tourEndBookingDate,
                                departureDate: tDepartureDate,
                                tourName: tourName,
                                departureStationId: uniqueStationArray[0],
                                tourGuideId: chosenTourGuide.userId,
                                driverId: chosenDriver.userId,
                                busId: chosenBus.busId,
                                isScheduled: true,
                                ...body,
                            },
                            transaction: t,
                        });

                        await db.User.update({
                            maxTour: chosenTourGuide.maxTour,
                        }, {
                            where: { userId: chosenTourGuide.userId },
                            individualHooks: true,
                            transaction: t
                        });

                        await db.User.update({
                            maxTour: chosenDriver.maxTour,
                        }, {
                            where: { userId: chosenDriver.userId },
                            individualHooks: true,
                            transaction: t
                        });
                    } else {
                        createTour = await db.Tour.findOrCreate({
                            where: {
                                tourName: tourName
                            },
                            defaults: {
                                beginBookingDate: tourBeginBookingDate,
                                endBookingDate: tourEndBookingDate,
                                departureDate: tDepartureDate,
                                tourName: tourName,
                                departureStationId: uniqueStationArray[0],
                                ...body,
                            },
                            transaction: t,
                        });
                    }

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

                        let index = 0;
                        for (const stationId of uniqueStationArray) {
                            index += 1;
                            await db.TourDetail.create({
                                tourId: createTour[0].tourId,
                                stationId: stationId,
                                index: index,
                            }, { transaction: t });
                        }
                    }

                    resolve({
                        status: createTour[1] ? 200 : 400,
                        data: {
                            msg: createTour[1]
                                ? "Create new tour successfully"
                                : "Cannot create new tour/Tour name already exists",
                            tour: createTour[1] ? createTour[0].dataValues : null,
                            assignResult: availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0 && createTour[1]
                                ? "Assign employee to tour successfully!"
                                : 'Cannot employee to tour',
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

const createTourByFile = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction()
    try {
        const uploadedFile = req.file
        let tours = []
        let errors = []

        const ticketList = await db.TicketType.findAll({
            where: {
                status: STATUS.ACTIVE
            },
            order: [["createdAt", "DESC"]]
        })

        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 7);
        await readXlsxFile(uploadedFile.buffer).then((rows) => {
            for (let j = 3; j <= 12; j++) {
                let isValidRow = true
                let isValidTicket = false
                let isNotEmptyRow = true
                let rowError = []
                let tickets = []
                for (let i = 0; i < ticketList.length; i++) {
                    let ticket = { ticketName: rows[2][8 + i], isSelect: rows[j][8 + i] !== null ? rows[j][8 + i] : false }
                    if (rows[j][8 + i]) {
                        isValidTicket = true
                    }
                    tickets.push(ticket)
                }
                let tour = {
                    tourName: rows[j][1],
                    description: rows[j][2],
                    beginBookingDate: rows[j][3],
                    endBookingDate: rows[j][4],
                    departureDate: rows[j][5],
                    duration: rows[j][6],
                    route: rows[j][7],
                    tickets: tickets
                }

                if (
                    tour.tourName === null &&
                    tour.description === null &&
                    tour.beginBookingDate === null &&
                    tour.endBookingDate === null &&
                    tour.departureDate === null &&
                    tour.duration === null &&
                    tour.route === null &&
                    isValidTicket == false
                ) {
                    isNotEmptyRow = false
                }
                if (isNotEmptyRow == true) {
                    if (tour.tourName == null) {
                        let error = `Tour name is required`
                        rowError.push(error)
                        isValidRow = false;
                    }
                    if (tour.description == null) {
                        let error = `Description is required`
                        rowError.push(error)
                        isValidRow = false;
                    }
                    if (tour.beginBookingDate == null) {
                        let error = `Begin booking date is required`
                        rowError.push(error)
                        isValidRow = false;
                    } else if (!(tour.beginBookingDate instanceof Date)) {
                        let error = `Begin booking date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false;
                    }

                    if (tour.endBookingDate == null) {
                        let error = `End booking date is required`
                        rowError.push(error)
                        isValidRow = false;
                    } else if (!(tour.endBookingDate instanceof Date)) {
                        let error = `End booking date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false;
                    }

                    if (tour.departureDate == null) {
                        let error = `Departure date is required`
                        rowError.push(error)
                        isValidRow = false;
                    } else if (!(tour.departureDate instanceof Date)) {
                        let error = `Departure date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false;
                    }

                    if (tour.duration == null) {
                        let error = `Duration is required`
                        rowError.push(error)
                        isValidRow = false;
                    } else if (!(tour.duration instanceof Date)) {
                        let error = `duration need to be correct date format`
                        rowError.push(error)
                        isValidRow = false;
                    }

                    if (tour.route == null) {
                        let error = `Route is required`
                        rowError.push(error)
                        isValidRow = false;
                    }
                    if (isValidTicket == false) {
                        let error = `Tour need to has atleast 1 ticket set to true`
                        rowError.push(error)
                        isValidRow = false;
                    }
                    if (tour.endBookingDate != null) {
                        if (currentDate > tour.beginBookingDate) {
                            let error = `Begin booking date need to be after current date`
                            rowError.push(error)
                            isValidRow = false;
                        }
                    }
                    if (tour.beginBookingDate != null && tour.endBookingDate != null) {
                        if (tour.beginBookingDate === tour.endBookingDate) {
                            let error = `Begin Booking Date cannot be the same as End Booking Date`
                            rowError.push(error)
                            isValidRow = false;
                        }
                    }
                    if (tour.beginBookingDate != null && tour.endBookingDate != null) {
                        if (tour.beginBookingDate >= tour.endBookingDate) {
                            let tmp = tour.beginBookingDate
                            tour.beginBookingDate = tour.endBookingDate
                            tour.endBookingDate = tmp
                        }
                    }
                    if (tour.endBookingDate != null && tour.departureDate != null) {
                        if (tour.endBookingDate.getTime() + 24 * 60 * 60 * 1000 > tour.departureDate.getTime()) {
                            let error = `Departure Date need to be atleast 24 hours after End Booking Date`
                            rowError.push(error)
                            isValidRow = false;
                        }
                    }
                    if (rowError.length > 0) {
                        errors.push({ line: j - 2, rowError: rowError })
                    }

                    if (isValidRow == true) {
                        tours.push(tour)
                    }
                }
            }
        })

        //Create Process Start HERE
        const duplicateTourNames = new Set();
        for (const tour of tours) {
            let i = 1
            const route = await db.Route.findOne({
                raw: true,
                nest: true,
                where: {
                    routeName: tour.route
                },
            })
            if (!route) {
                let error = `Route not found with: ${tour.route}`
                errors.push({ line: i, tourError: error })
                i++
                continue
            }
            const routeSegment = await db.RouteSegment.findOne({
                raw: true,
                nest: true,
                where: {
                    routeId: route.routeId,
                    index: 1
                }
            });

            if (!routeSegment) {
                let error = `Route does not have route segment`
                errors.push({ line: i, tourError: error })
                i++
                continue
            }

            const resultTour = await db.Tour.findOne({
                raw: true,
                nest: true,
                where: {
                    tourName: tour.tourName
                },
            })

            if (resultTour) {
                let error = `Tour name existed: ${tour.tourName}`
                errors.push({ line: i, tourError: error })
                i++
                continue
            }

            if (duplicateTourNames.has(tour.tourName)) {
                let error = `Duplicate tour name within excel: ${tour.tourName} `
                errors.push({ line: i, tourError: error })
                i++
                continue
            }
            duplicateTourNames.add(tour.tourName);
            const setUpTour = {
                tourName: tour.tourName,
                description: tour.description,
                beginBookingDate: tour.beginBookingDate,
                endBookingDate: tour.endBookingDate,
                departureDate: tour.departureDate,
                duration: tour.duration,
                routeId: route.routeId,
                departureStationId: routeSegment.departureStationId
            }
            const createTour = await db.Tour.create(setUpTour, { transaction: t })
            if (!createTour) {
                let error = `Error create tour: ${tour.tourName} `
                errors.push({ line: i, tourError: error })
                i++
                continue
            }
            const tourJson = createTour.toJSON();

            for (const ticket of tour.tickets) {
                if (ticket.isSelect == true) {
                    const ticketType = await db.TicketType.findOne({
                        where: {
                            ticketTypeName: ticket.ticketName
                        },
                    })

                    if (!ticketType) {
                        let error = `Ticket not found with: ${ticket.ticketName}`
                        errors.push({ line: i, tourError: error })
                        i++
                        continue
                    }

                    if (STATUS.DEACTIVE == ticketType.status) {
                        let error = `Ticket is Deactive with: ${ticket.ticketName}`
                        errors.push({ line: i, tourError: error })
                        i++
                        continue
                    }

                    let day = DAY_ENUM.NORMAL

                    const dayOfWeek = tour.departureDate.getDay()
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        day = DAY_ENUM.WEEKEND
                    }
                    const date = tour.departureDate.getDate()
                    const month = tour.departureDate.getMonth()
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
                        let error = `Ticket price for ${day} not found with: ${ticket.ticketName}`
                        errors.push({ line: i, tourError: error })
                        i++
                        continue
                    }
                    const resultTicket = await db.Ticket.findOne({
                        raw: true,
                        nest: true,
                        where: {
                            ticketTypeId: ticketType.ticketTypeId,
                            tourId: tourJson.tourId
                        },
                    })
                    if (resultTicket) {
                        let error = `Duplicate ticket(${ticket.ticketName}) in tour(${tourJson.tourName})`
                        errors.push({ line: i, tourError: error })
                        i++
                        continue
                    }
                    const setUpTicket = { tourId: tourJson.tourId, ticketTypeId: ticketType.ticketTypeId }
                    const createTicket = await db.Ticket.create(
                        setUpTicket,
                        { transaction: t },
                    )

                    if (!createTicket) {
                        let error = `Error create ticket(${ticket.ticketName}) in tour(${tourJson.tourName})`
                        errors.push({ line: i, tourError: error })
                        i++
                        continue
                    }
                }
            }
            i++
        }
        await t.commit();
        resolve({
            status: 201,
            data: {
                msg: `Create tour using excel file successfully`,
                errors: errors,
            }
        });
    } catch (error) {
        await t.rollback();
        reject(error)
    }
})

const assignTour = () =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 7);

                // Initialize the schedule
                const findScheduledTour = await db.Tour.findAll({
                    raw: true, nest: true,
                    order: [['departureDate', 'ASC']],
                    where: {
                        departureDate: {
                            [Op.gte]: currentDate,
                        },
                        isScheduled: true,
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
                        "isScheduled"
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

                const findTourActive = await db.Tour.findAll({
                    raw: true, nest: true,
                    order: [['departureDate', 'ASC']],
                    where: {
                        departureDate: {
                            [Op.gte]: currentDate,
                        },
                        isScheduled: false,
                    }
                })

                if (findTourActive.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are no tours active'
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
                            msg: 'There are no buses active'
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
                            msg: 'There are no tour guide available'
                        }
                    })
                    return;
                }

                if (findDriver.length == 0) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'There are no driver available'
                        }
                    })
                    return;
                }

                const schedule = [];
                const scheduleFinal = [];
                if (findScheduledTour.length > 0) {
                    for (const tour of findScheduledTour) {
                        const tourGuide = tour.tour_tourguide;
                        const driver = tour.tour_driver;
                        const bus = tour.tour_bus;

                        schedule.push({ tour, tourGuide, driver, bus });
                    }
                }
                for (const tour of findTourActive) {
                    // console.log(tour);
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
                            // bus.numberSeat >= 2 && 
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate);

                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;
                                // console.log(`${bus.busPlate} + ${assignment.tour.tourName}`, endDate >= tour.departureDate);
                                return endDate >= tour.departureDate && assignment.bus.busId == bus.busId
                            })
                    );

                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        const chosenTourGuide = availableTourGuide[0];
                        const chosenDriver = availableDriver[0];
                        chosenTourGuide.maxTour--;
                        chosenDriver.maxTour--;

                        const chosenBus = availableBuses[0];
                        schedule.push({ tour, tourGuide: chosenTourGuide, driver: chosenDriver, bus: chosenBus });
                        scheduleFinal.push({ tour, tourGuide: chosenTourGuide, driver: chosenDriver, bus: chosenBus });
                    }
                }

                const findTourNotScheduled = findTourActive.filter(itemA => !schedule.some(itemB => itemB.tour.tourId === itemA.tourId));

                if (scheduleFinal.length > 0) {
                    for (const assignment of scheduleFinal) {
                        // console.log(
                        //     `Tour ${assignment.tour.tourId} at ${assignment.tour.departureDate.toISOString()} assigned to ${assignment.tourGuide.userId}, ${assignment.driver.userId} on Bus ${assignment.bus.busId}`
                        // );

                        await db.Tour.update({
                            tourGuideId: assignment.tourGuide.userId,
                            driverId: assignment.driver.userId,
                            busId: assignment.bus.busId,
                            isScheduled: true,
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
                    }

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

                resolve({
                    status: 200,
                    data: {
                        msg:
                            findTourNotScheduled.length == 0
                                ? 'Tours have been scheduled'
                                : 'Tour name ' + findTourNotScheduled.map(tour => `'${tour.tourName}'`).join(', ') + ' cannot be scheduled'
                    }
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

                    if (currentDate > tourBeginBookingDate) {
                        resolve({
                            status: 400,
                            data: {
                                msg: "Begin booking date can't be earlier than current date"
                            }
                        })
                        return;
                    } else if (tourBeginBookingDate >= tourEndBookingDate) {
                        resolve({
                            status: 400,
                            data: {
                                msg: "Begin booking date can't be later than End booking date",
                            }
                        });
                        return;
                    } else if (tourEndBookingDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                        resolve({
                            status: 400,
                            data: {
                                msg: "End booking date must be 24 hours earlier than Departure date",
                            }
                        });
                        return;
                    } else {
                        let tourGuide = body.tourGuideId
                        let driver = body.driverId
                        const findTour = await db.Tour.findOne({
                            raw: true, nest: true,
                            where: {
                                tourId: tourId
                            },
                        })
                        if (tourGuide) {
                            const findScheduledTourGuild = await db.Tour.findAll({
                                raw: true, nest: true,
                                order: [['departureDate', 'ASC']],
                                where: {
                                    departureDate: {
                                        [Op.gte]: currentDate,
                                    },
                                    isScheduled: true,
                                    tourGuideId: body.tourGuideId
                                },
                            })
                            const checkDuplicatedTime = findScheduledTourGuild.some((assignment) => {
                                const departureDate = new Date(assignment.departureDate);
                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;

                                // Check if the tour guide is available
                                return endDate >= findTour.departureDate
                            })

                            if (checkDuplicatedTime) {
                                resolve({
                                    status: 400,
                                    data: {
                                        msg: "Tour guide time is duplicated",
                                    }
                                });
                                return;
                            }
                        } else if (driver) {
                            const findScheduledDriver = await db.Tour.findAll({
                                raw: true, nest: true,
                                order: [['departureDate', 'ASC']],
                                where: {
                                    departureDate: {
                                        [Op.gte]: currentDate,
                                    },
                                    isScheduled: true,
                                    driverId: body.driverId
                                },
                            })

                            const checkDuplicatedTime = findScheduledDriver.some((assignment) => {
                                const departureDate = new Date(assignment.departureDate);
                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.duration.split(':').map(Number);

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours);
                                departureDate.setMinutes(departureDate.getMinutes() + minutes);
                                departureDate.setSeconds(departureDate.getSeconds() + seconds);
                                const endDate = departureDate;

                                // Check if the tour guide is available
                                return endDate >= findTour.departureDate
                            })
                            if (checkDuplicatedTime) {
                                resolve({
                                    status: 400,
                                    data: {
                                        msg: "Driver time is duplicated",
                                    }
                                });
                                return;
                            }
                        }

                        let departureStation = body.routeId;
                        let station;
                        if (departureStation) {
                            station = await db.Route.findOne({
                                raw: true,
                                nest: true,
                                where: {
                                    routeId: departureStation
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
                        }

                        const tours = await db.Tour.update({
                            departureStationId: departureStation ? station.route_segment.stationId : findTour.departureStationId,
                            beginBookingDate: body.beginBookingDate ? tourBeginBookingDate : findTour.beginBookingDate,
                            endBookingDate: body.tourEndBookingDate ? tourEndBookingDate : findTour.tourEndBookingDate,
                            departureDate: body.tDepartureDate ? tDepartureDate : findTour.tDepartureDate,
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
    createTourByFile,
    getAllTour,
    getTourById,
    assignTour,
};
