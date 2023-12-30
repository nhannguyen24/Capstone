const db = require("../models")
const { Op } = require("sequelize")
const redisClient = require("../config/RedisConfig")
const STATUS = require("../enums/StatusEnum")
const TOUR_SCHEDULE_STATUS = require("../enums/TourScheduleStatusEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const readXlsxFile = require('read-excel-file/node')
const { StatusCodes } = require("http-status-codes")
const { sendNotification } = require("../utils/NotificationUtil")
const { sortRouteSegmentByDepartureStation } = require("../utils/SortRouteSegmentUlti")
// const { schedule } = require("node-cron")

const getAllTour = (
    { page, limit, order, tourName, status, scheduleId, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${status}_${scheduleId}`, async (error, tour) => {
                if (tour != null && tour != "") {
                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: "Got tours",
                            tours: JSON.parse(tour),
                        }
                    })
                } else {
                    const queries = { nest: true }
                    const querySchedule = {}
                    const offset = !page || +page <= 1 ? 0 : +page - 1
                    const flimit = +limit || +process.env.LIMIT_POST
                    queries.offset = offset * flimit
                    queries.limit = flimit
                    if (order) queries.order = [[order]]
                    // else {
                    //     queries.order = [
                    //         ['updatedAt', 'DESC'],
                    //         [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                    //         [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, { model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                    //     ]
                    // }
                    if (tourName) query.tourName = { [Op.substring]: tourName }
                    if (status) query.status = { [Op.eq]: status }
                    if (scheduleId) querySchedule.scheduleId = { [Op.eq]: scheduleId }

                    const tours = await db.Tour.findAll({
                        where: query,
                        ...queries,
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
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
                                        "poiId",
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                            {
                                model: db.Schedule,
                                as: "tour_schedule",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                                where: querySchedule,
                                include: [
                                    {
                                        model: db.Bus,
                                        as: "schedule_bus",
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
                                        as: "schedule_tourguide",
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
                                        as: "schedule_driver",
                                        attributes: [
                                            "userId",
                                            "userName",
                                            "email",
                                            "avatar",
                                            "phone",
                                        ],
                                    },
                                    {
                                        model: db.Station,
                                        as: "schedule_departure_station",
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
                            }
                        ]
                    })

                    await Promise.all(tours.map(async (tour) => {
                        const tourPromisses = tour.tour_schedule.map(async (schedule) => {
                            const booking = await db.BookingDetail.findAll({
                                raw: true,
                                nest: true,
                                where: {
                                    status: STATUS.ACTIVE
                                },
                                include: {
                                    model: db.Ticket,
                                    as: "booking_detail_ticket",
                                    where: {
                                        tourId: schedule.tourId
                                    },
                                    attributes: []
                                },
                                attributes: [
                                    [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'total_quantity'],
                                ]
                            })

                            if (schedule.schedule_bus !== null) {
                                if (booking[0].total_quantity === null) {
                                    schedule.dataValues.availableSeats = schedule.schedule_bus.numberSeat
                                } else {
                                    schedule.dataValues.availableSeats = schedule.schedule_bus.numberSeat - parseInt(booking[0].total_quantity)
                                }
                            } else {
                                schedule.dataValues.availableSeats = 0
                            }

                            const routeSegments = await db.RouteSegment.findAll({
                                raw: true, nest: true,
                                where: {
                                    tourId: tour.tourId
                                },
                                order: [
                                    ['index', 'ASC'],
                                    [{ model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                                ],
                                attributes: {
                                    exclude: [
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
                            })

                            const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(routeSegments, schedule.departureStationId);
                            schedule.dataValues.route_segment = routeSegmentsSortByDepartureStation;
                        })
                        await Promise.all(tourPromisses)

                        const feedbacks = await db.Feedback.findAll({
                            raw: true,
                            nest: true,
                            where: {
                                tourId: tour.tourId,
                            },
                            attributes: [
                                [db.Sequelize.fn('AVG', db.Sequelize.col('stars')), 'average_stars']
                            ]
                        })

                        if (feedbacks[0].average_stars === null) {
                            tour.dataValues.avgStars = 0
                        } else {
                            tour.dataValues.avgStars = parseFloat(feedbacks[0].average_stars)
                        }
                    })
                    )

                    redisClient.setEx(`tours_${page}_${limit}_${order}_${tourName}_${status}_${scheduleId}`, 3600, JSON.stringify(tours))

                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: tours ? "Got tours" : "Tours not found!",
                            tours: tours,
                        }
                    })
                }
            })
        } catch (error) {
            reject(error)
        }
    })

const getTourById = (tourId) =>
    new Promise(async (resolve, reject) => {
        try {
            const tours = await db.Tour.findAll({
                where: { tourId: tourId },
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Image,
                        as: "tour_image",
                        attributes: {
                            exclude: [
                                "tourId",
                                "busId",
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
                        model: db.Schedule,
                        as: "tour_schedule",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.Bus,
                                as: "schedule_bus",
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
                                as: "schedule_tourguide",
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
                                as: "schedule_driver",
                                attributes: [
                                    "userId",
                                    "userName",
                                    "email",
                                    "avatar",
                                    "phone",
                                ],
                            },
                            {
                                model: db.Station,
                                as: "schedule_departure_station",
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
            })

            await Promise.all(tours.map(async (tour) => {
                const tourPromisses = tour.tour_schedule.map(async (schedule) => {
                    const booking = await db.BookingDetail.findAll({
                        raw: true,
                        nest: true,
                        where: {
                            status: STATUS.ACTIVE
                        },
                        include: {
                            model: db.Ticket,
                            as: "booking_detail_ticket",
                            where: {
                                tourId: schedule.tourId
                            },
                            attributes: []
                        },
                        attributes: [
                            [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'total_quantity'],
                        ]
                    })

                    if (schedule.schedule_bus !== null) {
                        if (booking[0].total_quantity === null) {
                            schedule.dataValues.availableSeats = schedule.schedule_bus.numberSeat
                        } else {
                            schedule.dataValues.availableSeats = schedule.schedule_bus.numberSeat - parseInt(booking[0].total_quantity)
                        }
                    } else {
                        schedule.dataValues.availableSeats = 0
                    }

                    const routeSegment = await db.RouteSegment.findAll({
                        raw: true, nest: true,
                        where: {
                            tourId: tour.tourId
                        },
                        order: [
                            ['index', 'ASC'],
                            [{ model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                        ],
                        attributes: {
                            exclude: [
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
                    })

                    const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(routeSegment, schedule.departureStationId);
                    schedule.dataValues.route_segment = routeSegmentsSortByDepartureStation;
                })
                await Promise.all(tourPromisses)

                const feedbacks = await db.Feedback.findAll({
                    raw: true,
                    nest: true,
                    where: {
                        tourId: tour.tourId,
                    },
                    attributes: [
                        [db.Sequelize.fn('AVG', db.Sequelize.col('stars')), 'average_stars']
                    ]
                })

                if (feedbacks[0].average_stars === null) {
                    tour.dataValues.avgStars = 0
                } else {
                    tour.dataValues.avgStars = parseFloat(feedbacks[0].average_stars)
                }
            })
            )

            resolve({
                status: tours.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
                data: {
                    msg: tours.length > 0 ? "Got tour" : `Cannot find tour with id: ${tourId}`,
                    tour: tours,
                }
            })
        } catch (error) {
            reject(error)
        }
    })

const createTour = ({ images, tickets, tourName, ...body }) =>
    new Promise(async (resolve, reject) => {
        const t = await db.sequelize.transaction();
        try {
            for (const segmentObj of body.segments) {
                const findDepartureStation = await db.Station.findOne({
                    where: {
                        stationId: segmentObj.departureStationId,
                    },
                });

                if (!findDepartureStation) {
                    return resolve({
                        status: StatusCodes.BAD_REQUEST,
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
                        status: StatusCodes.BAD_REQUEST,
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
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: "Point of interest Id not found!",
                                },
                            });
                        }
                    }
                }
            }

            const createTour = await db.Tour.findOrCreate({
                where: {
                    tourName: tourName
                },
                defaults: {
                    tourName: tourName,
                    description: body.description,
                    duration: body.duration,
                    distance: body.distance,
                    geoJson: body.geoJson,
                },
                transaction: t,
            })

            let segmentIndex = 0;
            for (const segmentObj of body.segments) {
                let pointIndex = 0;
                segmentIndex += 1;
                const routeSegment = await db.RouteSegment.create(
                    {
                        tourId: createTour[0].dataValues.tourId,
                        distance: segmentObj.distance,
                        departureStationId: segmentObj.departureStationId,
                        endStationId: segmentObj.endStationId,
                        index: segmentIndex
                    },
                    { transaction: t }
                );

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

            // Initialize the schedule
            const currentDate = new Date()
            currentDate.setHours(currentDate.getHours() + 7)

            const findScheduledTour = await db.Schedule.findAll({
                raw: true, nest: true,
                order: [['departureDate', 'ASC']],
                where: {
                    status: {
                        [Op.ne]: STATUS.DEACTIVE,
                    },
                    [Op.and]: [
                        {
                            departureDate: {
                                [Op.gte]: currentDate,
                            },
                        },
                        {
                            endDate: {
                                [Op.gt]: currentDate,
                            },
                        }
                    ],
                    isScheduled: true,
                },
                attributes: {
                    exclude: [
                        "createdAt",
                        "updatedAt",
                    ]
                },
                include: [
                    {
                        model: db.Bus,
                        as: "schedule_bus",
                        attributes: [
                            "busId"
                        ]
                    },
                    {
                        model: db.User,
                        as: "schedule_tourguide",
                        attributes: [
                            "userId"
                        ]
                    },
                    {
                        model: db.User,
                        as: "schedule_driver",
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
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: 'There are no buses available'
                    }
                })
                return
            }

            const findTourguide = await db.User.findAll({
                raw: true, nest: true,
                attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
                order: [['maxTour', 'DESC']],
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
                attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
                order: [['maxTour', 'DESC']],
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
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: 'There are no tour guide available'
                    }
                })
                return
            }

            if (findDriver.length == 0) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: 'There are no driver available'
                    }
                })
                return
            }

            const schedule = []
            if (findScheduledTour.length > 0) {
                for (const tour of findScheduledTour) {
                    const tourGuide = tour.schedule_tourguide
                    const driver = tour.schedule_driver
                    const bus = tour.schedule_bus

                    schedule.push({ tour, tourGuide, driver, bus })
                }
            }

            let routeSegmentsSortByDepartureStation, createSchedule, availableTourGuide, availableDriver, availableBuses;
            for (const scheduleObj of body.schedules) {
                const BeforeTDepartureDate = new Date(scheduleObj.departureDate)
                const tDepartureDate = new Date(scheduleObj.departureDate)
                const [currentScheduleHours, currentScheduleMinutes, currentScheduleSeconds] = body.duration.split(':').map(Number)

                // Add the duration to the tDepartureDate
                tDepartureDate.setHours(tDepartureDate.getHours() + currentScheduleHours)
                tDepartureDate.setMinutes(tDepartureDate.getMinutes() + currentScheduleMinutes)
                tDepartureDate.setSeconds(tDepartureDate.getSeconds() + currentScheduleSeconds)
                const tEndDate = tDepartureDate

                if (currentDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: "Departure date must be 24 hours latter than current date",
                        }
                    })
                    await t.rollback();
                    return
                } else {
                    // Find an available employee for the tour
                    availableTourGuide = findTourguide.filter(
                        (employee) =>
                            employee.maxTour > 0 &&
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const currentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkTourGuide = true;
                                if (departureDate > currentEndDate && assignment.tourGuide?.userId === employee.userId) {
                                    checkTourGuide = false;
                                }

                                // console.log('departureDate', departureDate);
                                // console.log('endDate', endDate);
                                // console.log('beforeCurrentTourDepartureDate', beforeCurrentTourDepartureDate);
                                // console.log('currentEndDate', currentEndDate);

                                // console.log(`${assignment.tourGuide.userId}////${employee.userId}`, (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide.userId === employee.userId) && checkTourGuide);

                                // Check if the tour guide is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide?.userId === employee.userId) && checkTourGuide;
                            })
                    );

                    availableDriver = findDriver.filter(
                        (employee) =>
                            employee.maxTour > 0
                            && !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const currentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkDriver = true;
                                if (departureDate > currentEndDate && assignment.driver?.userId === employee.userId) {
                                    checkDriver = false;
                                }

                                // // Check if the driver is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.driver?.userId == employee.userId) && checkDriver;
                            })
                    );

                    availableBuses = findBusActive.filter(
                        (bus) =>
                            // bus.numberSeat >= 2 && 
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const currentTourDepartureDate = new Date(scheduleObj.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkBus = true;
                                if (departureDate > currentEndDate && assignment.bus?.busId == bus.busId) {
                                    checkBus = false;
                                }

                                // Check if the bus is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.bus?.busId == bus.busId) && checkBus;
                            })
                    );

                    let chosenTourGuide, chosenDriver, chosenBus;
                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        chosenTourGuide = availableTourGuide[0]
                        chosenDriver = availableDriver[0]
                        chosenTourGuide.maxTour--
                        chosenDriver.maxTour--
                        chosenBus = availableBuses[0]

                        createSchedule = await db.Schedule.create({
                            departureDate: BeforeTDepartureDate,
                            endDate: tEndDate,
                            departureStationId: scheduleObj.departureStationId,
                            tourGuideId: chosenTourGuide.userId,
                            driverId: chosenDriver.userId,
                            busId: chosenBus.busId,
                            isScheduled: true,
                            tourId: createTour[0].dataValues.tourId,
                        }, { transaction: t })

                        await db.User.update({
                            maxTour: chosenTourGuide.maxTour,
                        }, {
                            where: { userId: chosenTourGuide.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        await db.User.update({
                            maxTour: chosenDriver.maxTour,
                        }, {
                            where: { userId: chosenDriver.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        const createdDepartureDate = new Date(scheduleObj.departureDate);

                        const formattedDate = createdDepartureDate.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        });

                        const createNotiTourGuide = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${createTour[0].dataValues.tourName} - ${formattedDate}`,
                            deviceToken: chosenTourGuide.deviceToken,
                            notiType: "Thông báo",
                            userId: chosenTourGuide.userId
                        }, { transaction: t })

                        if (createNotiTourGuide) {
                            sendNotification(
                                createNotiTourGuide.title,
                                createNotiTourGuide.body,
                                createNotiTourGuide.deviceToken,
                                createNotiTourGuide.notiType
                            );
                        };

                        const createNotiDriver = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${createTour[0].dataValues.tourName} - ${formattedDate}`,
                            deviceToken: chosenDriver.deviceToken,
                            notiType: "Thông báo",
                            userId: chosenDriver.userId
                        }, { transaction: t })

                        if (createNotiDriver) {
                            sendNotification(
                                createNotiDriver.title,
                                createNotiDriver.body,
                                createNotiDriver.deviceToken,
                                createNotiDriver.notiType
                            );
                        };
                        schedule.push({ tour: createSchedule.dataValues, tourGuide: { userId: chosenTourGuide.userId }, driver: { userId: chosenDriver.userId }, bus: { busId: chosenBus.busId } })
                    }
                    else {
                        createSchedule = await db.Schedule.create({
                            departureDate: BeforeTDepartureDate,
                            endDate: tEndDate,
                            departureStationId: scheduleObj.departureStationId,
                            tourId: createTour[0].dataValues.tourId,
                        }, { transaction: t })
                        schedule.push({ tour: createSchedule.dataValues, tourGuide: null, driver: null, bus: null })
                    }

                    routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(body.segments, scheduleObj.departureStationId)
                    let uniqueStationArray = [];
                    routeSegmentsSortByDepartureStation.forEach(item => {
                        if (!uniqueStationArray.includes(item.departureStationId)) {
                            uniqueStationArray.push(item.departureStationId)
                        }
                        if (uniqueStationArray.includes(item.endStationId)) {
                            uniqueStationArray.push(item.endStationId)
                        }
                    })

                    let index = 0
                    for (const stationId of uniqueStationArray) {
                        index += 1
                        await db.TourDetail.create({
                            scheduleId: createSchedule.scheduleId,
                            stationId: stationId,
                            index: index,
                        }, { transaction: t })
                    }
                }
            }

            let isValidTickets = false
            const dependTickets = []
            const promises = tickets.map(async (ticketTypeId) => {
                const ticketType = await db.TicketType.findOne({
                    raw: true,
                    where: {
                        ticketTypeId: ticketTypeId
                    },
                })
                if (!ticketType) {
                    await t.rollback()
                    resolve({
                        status: StatusCodes.NOT_FOUND,
                        data: {
                            msg: `Ticket type not found!`,
                        }
                    })
                }
                if (ticketType.dependsOnGuardian === 0) {
                    isValidTickets = true
                } else {
                    dependTickets.push(ticketType.ticketTypeName)
                }
            })

            await Promise.all(promises)

            if (!isValidTickets) {
                await t.rollback()
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `[${dependTickets}] need other guardian ticket to go with!`,
                    }
                })
            } else {
                const createTicketPromises = tickets.map(async (ticketTypeId) => {
                    const ticketType = await db.TicketType.findOne({
                        where: {
                            ticketTypeId: ticketTypeId
                        },
                    })

                    const price = await db.Price.findOne({
                        where: {
                            ticketTypeId: ticketType.ticketTypeId,
                        }
                    })
                    if (!price) {
                        await t.rollback()
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: `Ticket type doesn't have a price`,
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
                        })
                    }
                })
                await Promise.all(createTicketPromises)

                if (createTour[1]) {
                    if (images) {
                        const createImagePromises = images.map(async (image) => {
                            await db.Image.create({
                                image: image,
                                tourId: createTour[0].tourId,
                            }, { transaction: t })
                        })

                        await Promise.all(createImagePromises)
                    }
                }

                resolve({
                    status: createTour[1] ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg: createTour[1]
                            ? "Create new tour successfully"
                            : "Cannot create new tour/Tour name already exists",
                        tour: createTour[1] ? createTour[0].dataValues : null,
                        assignResult: availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0 && createTour[1]
                            ? "Assign employee to tour successfully!"
                            : 'Cannot assign employee to tour',
                    }
                })

                if (!createTour[1]) {
                    await t.rollback();
                } else {
                    await t.commit();
                }
                redisClient.keys('*tours_*', (error, keys) => {
                    if (error) {
                        console.error('Error retrieving keys:', error)
                        return
                    }
                    // Delete each key individually
                    keys.forEach((key) => {
                        redisClient.del(key, (deleteError, reply) => {
                            if (deleteError) {
                                console.error(`Error deleting key ${key}:`, deleteError)
                            } else {
                                console.log(`Key ${key} deleted successfully`)
                            }
                        })
                    })
                })
            }
        } catch (error) {
            // Rollback the transaction in case of an error
            await t.rollback();
            console.log(error);
            reject(error);
        }
    })

const createTourByFile = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction()
    try {
        const uploadedFile = req.file
        let tours = []
        let errors = []
        let createdTour = []

        const ticketList = await db.TicketType.findAll({
            where: {
                status: STATUS.ACTIVE
            },
            order: [["createdAt", "DESC"]]
        })

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        await readXlsxFile(uploadedFile.buffer).then(async (rows) => {
            for (let j = 3; j <= 12; j++) {
                let isValidRow = true
                let isValidTicket = false
                let isTiketDependsOnGuardian = true
                let isNotEmptyRow = true
                let rowError = []
                let tickets = []
                let dependTickets = []
                for (let i = 0; i < ticketList.length; i++) {
                    let ticket = { ticketName: rows[2][8 + i], isSelect: rows[j][8 + i] !== null && rows[j][8 + i] === "x" ? true : false }
                    if (rows[j][8 + i]) {
                        isValidTicket = true
                        const _ticket = await Promise.all([db.TicketType.findOne({
                            where: {
                                ticketTypeName: rows[2][8 + i]
                            }
                        })]);
                        for (const forTicket of _ticket) {
                            if (!forTicket.dependsOnGuardian) {
                                isTiketDependsOnGuardian = false
                            } else {
                                dependTickets.push(ticket.ticketName)
                            }
                            tickets.push(ticket)
                        }
                    }
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
                        isValidRow = false
                    }
                    if (tour.description == null) {
                        let error = `Description is required`
                        rowError.push(error)
                        isValidRow = false
                    }
                    if (tour.beginBookingDate == null) {
                        let error = `Begin booking date is required`
                        rowError.push(error)
                        isValidRow = false
                    } else if (!(tour.beginBookingDate instanceof Date)) {
                        let error = `Begin booking date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false
                    }

                    if (tour.endBookingDate == null) {
                        let error = `End booking date is required`
                        rowError.push(error)
                        isValidRow = false
                    } else if (!(tour.endBookingDate instanceof Date)) {
                        let error = `End booking date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false
                    }

                    if (tour.departureDate == null) {
                        let error = `Departure date is required`
                        rowError.push(error)
                        isValidRow = false
                    } else if (!(tour.departureDate instanceof Date)) {
                        let error = `Departure date need to be correct date format`
                        rowError.push(error)
                        isValidRow = false
                    }

                    if (tour.duration == null) {
                        let error = `Duration is required`
                        rowError.push(error)
                        isValidRow = false
                    } else if (!(tour.duration instanceof Date)) {
                        let error = `Duration need to be correct date format`
                        rowError.push(error)
                        isValidRow = false
                    }

                    if (tour.route == null) {
                        let error = `Route is required`
                        rowError.push(error)
                        isValidRow = false
                    }
                    if (!isValidTicket) {
                        let error = `Tour need to has atleast 1 ticket choosen`
                        rowError.push(error)
                        isValidRow = false
                    } else if (isTiketDependsOnGuardian) {
                        let error = `[${dependTickets}] need other guardian ticket to go with!`
                        rowError.push(error)
                        isValidRow = false
                    }
                    if (tour.endBookingDate != null) {
                        if (currentDate > tour.beginBookingDate) {
                            let error = `Begin booking date need to be after current date`
                            rowError.push(error)
                            isValidRow = false
                        }
                    }
                    if (tour.beginBookingDate != null && tour.endBookingDate != null) {
                        if (tour.beginBookingDate === tour.endBookingDate) {
                            let error = `Begin Booking Date cannot be the same as End Booking Date`
                            rowError.push(error)
                            isValidRow = false
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
                            isValidRow = false
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
        for (const tour of tours) {
            let i = 1;

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
            })

            if (!routeSegment) {
                let error = `Route does not have route segment`
                errors.push({ line: i, tourError: error })
                i++
                continue
            }

            const station = await db.Route.findAll({
                raw: true,
                nest: true,
                order: [
                    [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                ],
                where: {
                    routeName: tour.route
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
            })

            if (!station) {
                let error = `Route not found`
                errors.push({ line: i, tourError: error })
                i++
                continue
            }

            const uniqueStationArray = []

            // Loop through the JSON data and add station IDs to the array
            station.forEach(item => {
                if (!uniqueStationArray.includes(item.route_segment.departureStationId)) {
                    uniqueStationArray.push(item.route_segment.departureStationId)
                }
                if (uniqueStationArray.includes(item.route_segment.endStationId)) {
                    uniqueStationArray.push(item.route_segment.endStationId)
                }
            })

            setUpTour = {
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
            } else {
                createdTour.push(createTour.tourName)
            }
            const tourJson = createTour.toJSON()

            let index = 0
            for (const stationId of uniqueStationArray) {
                index += 1
                await db.TourDetail.create({
                    tourId: tourJson.tourId,
                    stationId: stationId,
                    index: index,
                }, { transaction: t })
            }

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

                    const price = await db.Price.findOne({
                        where: {
                            ticketTypeId: ticketType.ticketTypeId,
                        }
                    })

                    if (!price) {
                        let error = `Price not found!`
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

        redisClient.keys('*tours_*', (error, keys) => {
            if (error) {
                console.error('Error retrieving keys:', error)
                return
            }
            // Delete each key individually
            keys.forEach((key) => {
                redisClient.del(key, (deleteError, reply) => {
                    if (deleteError) {
                        console.error(`Error deleting key ${key}:`, deleteError)
                    } else {
                        console.log(`Key ${key} deleted successfully`)
                    }
                })
            })
        })

        await t.commit()
        resolve({
            status: errors.length > 0 ? StatusCodes.BAD_REQUEST : StatusCodes.CREATED,
            data: {
                msg: errors.length > 0 ? `Cannot create tour using excel` : `Create tour using excel file successfully`,
                createdTour: createdTour,
                errors: errors
            }
        })
    } catch (error) {
        await t.rollback()
        console.error(error)

        resolve({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
                errors: error.message
            }
        })
    }
})

const assignTour = () =>
    new Promise(async (resolve, reject) => {
        let transaction
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const currentDate = new Date()
                currentDate.setHours(currentDate.getHours() + 7)

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
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no tours active'
                        }
                    })
                    return
                }

                const findBusActive = await db.Bus.findAll({
                    raw: true, nest: true,
                    where: {
                        status: STATUS.ACTIVE
                    }
                })

                if (findBusActive.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no buses available'
                        }
                    })
                    return
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
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no tour guide available'
                        }
                    })
                    return
                }

                if (findDriver.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no driver available'
                        }
                    })
                    return
                }

                const schedule = []
                const scheduleFinal = []
                if (findScheduledTour.length > 0) {
                    for (const tour of findScheduledTour) {
                        const tourGuide = tour.tour_tourguide
                        const driver = tour.tour_driver
                        const bus = tour.tour_bus

                        schedule.push({ tour, tourGuide, driver, bus })
                    }
                }

                for (const tour of findTourActive) {
                    // Find an available employee for the tour
                    const availableTourGuide = findTourguide.filter(
                        (employee) =>
                            employee.maxTour > 0 &&
                            !schedule.some((assignment) => {
                                const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                const departureDate = new Date(assignment.tour.departureDate)
                                // Split the duration string into hours, minutes, and seconds
                                let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                hours += 1;

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours)
                                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                const endDate = departureDate

                                const beforeCurrentTourDepartureDate = new Date(tour.departureDate)
                                const currentTourDepartureDate = new Date(tour.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = tour.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkTourGuide = true;
                                if (beforeDepartureDate > currentEndDate && assignment.tourGuide.userId === employee.userId) {
                                    checkTourGuide = false;
                                }

                                // Check if the tour guide is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide.userId == employee.userId) && checkTourGuide;
                            })
                    )

                    const availableDriver = findDriver.filter(
                        (employee) =>
                            employee.maxTour > 0
                            // && !employee.driverId == tour.driverId
                            && !schedule.some((assignment) => {
                                const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                const departureDate = new Date(assignment.tour.departureDate)
                                // Split the duration string into hours, minutes, and seconds
                                let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                hours += 1;

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours)
                                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                const endDate = departureDate

                                const beforeCurrentTourDepartureDate = new Date(tour.departureDate)
                                const currentTourDepartureDate = new Date(tour.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = tour.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkDriver = true;
                                if (beforeDepartureDate > currentEndDate && assignment.driver.userId === employee.userId) {
                                    checkDriver = false;
                                }

                                return (endDate >= beforeCurrentTourDepartureDate && assignment.driver.userId == employee.userId) && checkDriver;
                            })
                    )

                    const availableBuses = findBusActive.filter(
                        (bus) =>
                            // bus.numberSeat >= 2 && 
                            !schedule.some((assignment) => {
                                const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                const departureDate = new Date(assignment.tour.departureDate)
                                // Split the duration string into hours, minutes, and seconds
                                let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                hours += 1;

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours)
                                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                const endDate = departureDate

                                const beforeCurrentTourDepartureDate = new Date(tour.departureDate)
                                const currentTourDepartureDate = new Date(tour.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = tour.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkBus = true;
                                if (beforeDepartureDate > currentEndDate && assignment.bus.busId === bus.busId) {
                                    checkBus = false;
                                }

                                // console.log(`${bus.busPlate} + ${assignment.tour.tourName}`, endDate >= tour.departureDate)
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.bus.busId == bus.busId) && checkBus;
                            })
                    )

                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        const chosenTourGuide = availableTourGuide[0]
                        const chosenDriver = availableDriver[0]
                        chosenTourGuide.maxTour--
                        chosenDriver.maxTour--

                        const chosenBus = availableBuses[0]
                        schedule.push({ tour, tourGuide: chosenTourGuide, driver: chosenDriver, bus: chosenBus })
                        scheduleFinal.push({ tour, tourGuide: chosenTourGuide, driver: chosenDriver, bus: chosenBus })
                    }
                }

                const findTourNotScheduled = findTourActive.filter(itemA => !schedule.some(itemB => itemB.tour.tourId === itemA.tourId))

                if (scheduleFinal.length > 0) {
                    for (const assignment of scheduleFinal) {
                        // console.log(
                        //     `Tour ${assignment.tour.tourId} at ${assignment.tour.departureDate.toISOString()} assigned to ${assignment.tourGuide.userId}, ${assignment.driver.userId} on Bus ${assignment.bus.busId}`
                        // )

                        await db.Tour.update({
                            tourGuideId: assignment.tourGuide.userId,
                            driverId: assignment.driver.userId,
                            busId: assignment.bus.busId,
                            isScheduled: true,
                        }, {
                            where: { tourId: assignment.tour.tourId },
                            individualHooks: true,
                            transaction: t
                        })

                        await db.User.update({
                            maxTour: assignment.tourGuide.maxTour,
                        }, {
                            where: { userId: assignment.tourGuide.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        await db.User.update({
                            maxTour: assignment.driver.maxTour,
                        }, {
                            where: { userId: assignment.driver.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        const findCurrentTour = await db.Tour.findOne({
                            nest: true,
                            where: { tourId: assignment.tour.tourId }
                        })

                        const createdDepartureDate = new Date(findCurrentTour.departureDate);

                        const createNotiTourGuide = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${findCurrentTour.tourName} - ${createdDepartureDate}`,
                            deviceToken: assignment.tourGuide.deviceToken,
                            notiType: "Thông báo",
                            userId: assignment.tourGuide.userId
                        }, { transaction: t })

                        if (createNotiTourGuide) {
                            sendNotification(
                                createNotiTourGuide.title,
                                createNotiTourGuide.body,
                                createNotiTourGuide.deviceToken,
                                createNotiTourGuide.notiType
                            );
                        };

                        const createNotiDriver = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${findCurrentTour.tourName} - ${createdDepartureDate}`,
                            deviceToken: assignment.driver.deviceToken,
                            notiType: "Thông báo",
                            userId: assignment.driver.userId
                        }, { transaction: t })

                        if (createNotiDriver) {
                            sendNotification(
                                createNotiDriver.title,
                                createNotiDriver.body,
                                createNotiDriver.deviceToken,
                                createNotiDriver.notiType
                            );
                        };
                    }

                    redisClient.keys('*tours_*', (error, keys) => {
                        if (error) {
                            console.error('Error retrieving keys:', error)
                            return
                        }
                        // Delete each key individually
                        keys.forEach((key) => {
                            redisClient.del(key, (deleteError, reply) => {
                                if (deleteError) {
                                    console.error(`Error deleting key ${key}:`, deleteError)
                                } else {
                                    console.log(`Key ${key} deleted successfully`)
                                }
                            })
                        })
                    })

                }

                resolve({
                    status: StatusCodes.OK,
                    data: {
                        msg:
                            findTourNotScheduled.length == 0
                                ? 'Tours have been scheduled'
                                : 'Tour name ' + findTourNotScheduled.map(tour => `'${tour.tourName}'`).join(', ') + ' cannot be scheduled'
                    }
                })

                await t.commit()
            })
        } catch (error) {
            // Rollback the transaction in case of an error
            await transaction.rollback()
            reject(error)
        }
    })

const updateTour = (id, { images, ...body }) =>
    new Promise(async (resolve, reject) => {
        let transaction
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                // const tour = await db.Tour.findOne({
                //     where: {
                //         tourName: body?.tourName,
                //         tourId: {
                //             [Op.ne]: id
                //         }
                //     }
                // })

                // if (tour !== null) {
                //     resolve({
                //         status: StatusCodes.CONFLICT,
                //         data: {
                //             msg: "Tour name already exists"
                //         }
                //     })
                // } else {
                const tours = await db.Tour.update(
                    // departureStationId: departureStation ? station.route_segment.stationId : findTour.departureStationId,
                    // beginBookingDate: body.beginBookingDate ? tourBeginBookingDate : findTour.beginBookingDate,
                    // endBookingDate: body.tourEndBookingDate ? tourEndBookingDate : findTour.tourEndBookingDate,
                    // departureDate: body.tDepartureDate ? tDepartureDate : findTour.tDepartureDate,
                    body,
                    {
                        where: { tourId: id, },
                        individualHooks: true,
                        transaction: t
                    }
                )

                if (body.tourStatus == TOUR_SCHEDULE_STATUS.STARTED) {
                    await db.TourDetail.update({
                        status: STATUS.NOTARRIVED,
                    }, {
                        where: { tourId: id, },
                        individualHooks: true,
                        transaction: t
                    })
                }

                if (body.tourStatus == TOUR_SCHEDULE_STATUS.FINISHED) {
                    await db.Bus.update({
                        status: STATUS.ACTIVE,
                    }, {
                        where: { busId: findTour.busId },
                        individualHooks: true,
                        transaction: t
                    })

                    const bookingOfTour = await db.BookingDetail.findAll({
                        nest: true,
                        include: [
                            {
                                model: db.Ticket,
                                as: "booking_detail_ticket",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                                where: {
                                    tourId: { [Op.eq]: findTour.tourId },
                                },
                            },
                        ]
                    })

                    let bookingDetailIdArray = []
                    for (const bookingDetail of bookingOfTour) {
                        bookingDetailIdArray.push(bookingDetail.bookingId)
                    }

                    await db.Booking.update({
                        bookingStatus: BOOKING_STATUS.FINISHED,
                    }, {
                        where: {
                            bookingId: {
                                [Op.in]: bookingDetailIdArray
                            },
                            bookingStatus: BOOKING_STATUS.ON_GOING
                        },
                        individualHooks: true,
                        transaction: t
                    })
                }

                if (images) {
                    await db.Image.destroy({
                        where: {
                            tourId: id,
                        }
                    })

                    const createImagePromises = images.map(async (image) => {
                        await db.Image.create({
                            image: image,
                            tourId: id,
                        }, { transaction: t })
                    })

                    await Promise.all(createImagePromises)
                }

                resolve({
                    status: tours[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg:
                            tours[1].length !== 0
                                ? `Tour update`
                                : "Cannot update tour/ tourId not found",
                    }
                })

                redisClient.keys('*tours_*', (error, keys) => {
                    if (error) {
                        console.error('Error retrieving keys:', error)
                        return
                    }
                    // Delete each key individually
                    keys.forEach((key) => {
                        redisClient.del(key, (deleteError, reply) => {
                            if (deleteError) {
                                console.error(`Error deleting key ${key}:`, deleteError)
                            } else {
                                console.log(`Key ${key} deleted successfully`)
                            }
                        })
                    })
                })
                await t.commit()
            })
        } catch (error) {
            // Rollback the transaction in case of an error
            if (transaction) {
                await transaction.rollback()
            }
            reject(error.message)
        }
    })

const deleteTour = (id) =>
    new Promise(async (resolve, reject) => {
        try {
            const tour = await db.Tour.findOne({
                raw: true, nest: true,
                where: { tourId: id },
            })

            if (tour.status === "Deactive") {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: "The tour already deactive!",
                    }
                })
                return
            }

            const tours = await db.Tour.update(
                { status: "Deactive" },
                {
                    where: { tourId: id },
                    individualHooks: true,
                }
            )
            resolve({
                status: tours[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                data: {
                    msg:
                        tours[0] > 0
                            ? `${tours[0]} tour delete`
                            : "Cannot delete tour/ tourId not found",
                }
            })

            redisClient.keys('*tours_*', (error, keys) => {
                if (error) {
                    console.error('Error retrieving keys:', error)
                    return
                }
                // Delete each key individually
                keys.forEach((key) => {
                    redisClient.del(key, (deleteError, reply) => {
                        if (deleteError) {
                            console.error(`Error deleting key ${key}:`, deleteError)
                        } else {
                            console.log(`Key ${key} deleted successfully`)
                        }
                    })
                })
            })

        } catch (error) {
            reject(error)
        }
    })

const cloneTour = (id, body) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const tours = await db.Tour.findAll({
                    where: { tourId: id },
                    nest: true,
                    attributes: {
                        exclude: ["createdAt", "updatedAt"],
                    },
                    include: [
                        {
                            model: db.Image,
                            as: "tour_image",
                            attributes: {
                                exclude: [
                                    "tourId",
                                    "busId",
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
                })

                if (tours.length <= 0) {
                    resolve({
                        status: StatusCodes.NOT_FOUND,
                        data: {
                            msg: `Cannot find tour with id: ${id}`
                        }
                    })
                    return
                }

                for (const tour of tours) {
                    const station = await db.Route.findAll({
                        raw: true,
                        nest: true,
                        order: [
                            [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                        ],
                        where: {
                            routeId: tour.routeId
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
                    })

                    const uniqueStationArray = []

                    // Loop through the JSON data and add station IDs to the array
                    station.forEach(item => {
                        if (!uniqueStationArray.includes(item.route_segment.departureStationId)) {
                            uniqueStationArray.push(item.route_segment.departureStationId)
                        }
                        if (uniqueStationArray.includes(item.route_segment.endStationId)) {
                            uniqueStationArray.push(item.route_segment.endStationId)
                        }
                    })

                    const currentDate = new Date()
                    currentDate.setHours(currentDate.getHours() + 7)
                    const tDepartureDate = new Date(body.departureDate)
                    const tourBeginBookingDate = new Date(body.beginBookingDate)
                    const tourEndBookingDate = new Date(body.endBookingDate)

                    if (currentDate > tourBeginBookingDate) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: "Begin booking date can't be earlier than current date"
                            }
                        })
                        return
                    } else if (tourBeginBookingDate >= tourEndBookingDate) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: "Begin booking date can't be later than End booking date",
                            }
                        })
                        return
                    } else if (tourEndBookingDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: "End booking date must be 24 hours earlier than Departure date",
                            }
                        })
                        return
                    } else {
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
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: 'There are no buses available'
                                }
                            })
                            return
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
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: 'There are no tour guide available'
                                }
                            })
                            return
                        }

                        if (findDriver.length == 0) {
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: 'There are no driver available'
                                }
                            })
                            return
                        }

                        const schedule = []
                        if (findScheduledTour.length > 0) {
                            for (const tour of findScheduledTour) {
                                const tourGuide = tour.tour_tourguide
                                const driver = tour.tour_driver
                                const bus = tour.tour_bus

                                schedule.push({ tour, tourGuide, driver, bus })
                            }
                        }

                        // Find an available employee for the tour
                        const availableTourGuide = findTourguide.filter(
                            (employee) =>
                                employee.maxTour > 0 &&
                                !schedule.some((assignment) => {
                                    const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                    const departureDate = new Date(assignment.tour.departureDate)
                                    // Split the duration string into hours, minutes, and seconds
                                    let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                    hours += 1;

                                    // Add the duration to the departureDate
                                    departureDate.setHours(departureDate.getHours() + hours)
                                    departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                    departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                    const endDate = departureDate

                                    const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                    const currentTourDepartureDate = new Date(body.departureDate)
                                    const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                    // Add the duration to the departureDate
                                    currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                    currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                    currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                    const currentEndDate = currentTourDepartureDate

                                    let checkTourGuide = true;
                                    if (beforeDepartureDate > currentEndDate && assignment.tourGuide.userId === employee.userId) {
                                        checkTourGuide = false;
                                    }

                                    // Check if the tour guide is available
                                    return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide.userId === employee.userId) && checkTourGuide;
                                })
                        );

                        const availableDriver = findDriver.filter(
                            (employee) =>
                                employee.maxTour > 0
                                && !schedule.some((assignment) => {
                                    const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                    const departureDate = new Date(assignment.tour.departureDate)
                                    // Split the duration string into hours, minutes, and seconds
                                    let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                    hours += 1;

                                    // Add the duration to the departureDate
                                    departureDate.setHours(departureDate.getHours() + hours)
                                    departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                    departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                    const endDate = departureDate

                                    const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                    const currentTourDepartureDate = new Date(body.departureDate)
                                    const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                    // Add the duration to the departureDate
                                    currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                    currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                    currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                    const currentEndDate = currentTourDepartureDate

                                    let checkDriver = true;
                                    if (beforeDepartureDate > currentEndDate && assignment.driver.userId === employee.userId) {
                                        checkDriver = false;
                                    }

                                    // // Check if the driver is available
                                    return (endDate >= beforeCurrentTourDepartureDate && assignment.driver.userId == employee.userId) && checkDriver;
                                })
                        );

                        const availableBuses = findBusActive.filter(
                            (bus) =>
                                // bus.numberSeat >= 2 && 
                                !schedule.some((assignment) => {
                                    const beforeDepartureDate = new Date(assignment.tour.departureDate)
                                    const departureDate = new Date(assignment.tour.departureDate)
                                    // Split the duration string into hours, minutes, and seconds
                                    let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                                    hours += 1;

                                    // Add the duration to the departureDate
                                    departureDate.setHours(departureDate.getHours() + hours)
                                    departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                    departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                    const endDate = departureDate

                                    const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                    const currentTourDepartureDate = new Date(body.departureDate)
                                    const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                                    // Add the duration to the departureDate
                                    currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                    currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                    currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                    const currentEndDate = currentTourDepartureDate

                                    let checkBus = true;
                                    if (beforeDepartureDate > currentEndDate && assignment.bus.busId == bus.busId) {
                                        checkBus = false;
                                    }

                                    // Check if the bus is available
                                    return (endDate >= beforeCurrentTourDepartureDate && assignment.bus.busId == bus.busId) && checkBus;
                                })
                        );

                        let createTour
                        if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                            const chosenTourGuide = availableTourGuide[0]
                            const chosenDriver = availableDriver[0]
                            chosenTourGuide.maxTour--
                            chosenDriver.maxTour--

                            const chosenBus = availableBuses[0]

                            createTour = await db.Tour.create({
                                tourName: body.tourName ? body.tourName : tour.tourName,
                                description: tour.description,
                                beginBookingDate: tourBeginBookingDate,
                                endBookingDate: tourEndBookingDate,
                                departureDate: tDepartureDate,
                                departureStationId: uniqueStationArray[0],
                                routeId: tour.routeId,
                                tourGuideId: chosenTourGuide.userId,
                                driverId: chosenDriver.userId,
                                busId: chosenBus.busId,
                                isScheduled: true,
                                ...body
                            }, { transaction: t })

                            await db.User.update({
                                maxTour: chosenTourGuide.maxTour,
                            }, {
                                where: { userId: chosenTourGuide.userId },
                                individualHooks: true,
                                transaction: t
                            })

                            await db.User.update({
                                maxTour: chosenDriver.maxTour,
                            }, {
                                where: { userId: chosenDriver.userId },
                                individualHooks: true,
                                transaction: t
                            })

                            const createdDepartureDate = new Date(createTour.departureDate);

                            const formattedDate = createdDepartureDate.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            });

                            const createNotiTourGuide = await db.Notification.create({
                                title: "Bạn có một chuyến đi mới",
                                body: `Chuyến tên ${createTour.tourName} - ${formattedDate}`,
                                deviceToken: chosenTourGuide.deviceToken,
                                notiType: "Thông báo",
                                userId: createTour.tourGuideId
                            }, { transaction: t })

                            if (createNotiTourGuide) {
                                sendNotification(
                                    createNotiTourGuide.title,
                                    createNotiTourGuide.body,
                                    createNotiTourGuide.deviceToken,
                                    createNotiTourGuide.notiType
                                );
                            };

                            const createNotiDriver = await db.Notification.create({
                                title: "Bạn có một chuyến đi mới",
                                body: `Chuyến tên ${createTour.tourName} - ${formattedDate}`,
                                deviceToken: chosenDriver.deviceToken,
                                notiType: "Thông báo",
                                userId: createTour.driverId
                            }, { transaction: t })

                            if (createNotiDriver) {
                                sendNotification(
                                    createNotiDriver.title,
                                    createNotiDriver.body,
                                    createNotiDriver.deviceToken,
                                    createNotiDriver.notiType
                                );
                            };
                        } else {
                            createTour = await db.Tour.create({
                                tourName: body.tourName ? body.tourName : tour.tourName,
                                description: tour.description,
                                beginBookingDate: tourBeginBookingDate,
                                endBookingDate: tourEndBookingDate,
                                departureDate: tDepartureDate,
                                departureStationId: uniqueStationArray[0],
                                routeId: tour.routeId,
                                ...body
                            }, { transaction: t })
                        }

                        let arrayTicketTour = tour.tour_ticket
                        const createTicketPromises = arrayTicketTour.map(async (ticket) => {
                            const ticketType = await db.TicketType.findOne({
                                where: {
                                    ticketTypeId: ticket.ticket_type.ticketTypeId
                                },
                                transaction: t,
                            })

                            if (!ticketType) {
                                resolve({
                                    status: StatusCodes.NOT_FOUND,
                                    data: {
                                        msg: `Ticket type not found with id ${ticket.ticket_type.ticketTypeId}`,
                                    }
                                })
                                return
                            }
                            if (STATUS.DEACTIVE == ticketType.status) {
                                resolve({
                                    status: StatusCodes.CONFLICT,
                                    data: {
                                        msg: `Ticket type is "Deactive"`,
                                    }
                                })
                                return
                            }

                            const price = await db.Price.findOne({
                                where: {
                                    ticketTypeId: ticketType.ticketTypeId,
                                }
                            })
                            if (!price) {
                                resolve({
                                    status: StatusCodes.CONFLICT,
                                    data: {
                                        msg: `Ticket type doesn't have a price!`,
                                    }
                                })
                            } else {
                                await db.Ticket.findOrCreate({
                                    where: {
                                        ticketTypeId: ticket.ticket_type.ticketTypeId,
                                        tourId: createTour.dataValues.tourId
                                    },
                                    defaults: { ticketTypeId: ticket.ticket_type.ticketTypeId, tourId: createTour.dataValues.tourId, },
                                    transaction: t,
                                })
                            }
                        })
                        await Promise.all(createTicketPromises)

                        if (createTour) {
                            let arrayImageTour = tour.tour_image
                            if (arrayImageTour.length > 0) {
                                const createImagePromises = arrayImageTour.map(async (image) => {
                                    await db.Image.create({
                                        image: image.image,
                                        tourId: createTour.dataValues.tourId,
                                    }, { transaction: t })
                                })
                                await Promise.all(createImagePromises)
                            }

                            let index = 0
                            for (const stationId of uniqueStationArray) {
                                index += 1
                                await db.TourDetail.create({
                                    tourId: createTour.dataValues.tourId,
                                    stationId: stationId,
                                    index: index,
                                }, { transaction: t })
                            }
                        }
                        resolve({
                            status: createTour ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                            data: {
                                msg: createTour
                                    ? "Create new tour successfully"
                                    : "Cannot create new tour/Tour name already exists",
                                tour: createTour ? createTour.dataValues : null,
                                assignResult: availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0 && createTour
                                    ? "Assign employee to tour successfully!"
                                    : 'Cannot assign employee to tour',
                            }
                        })

                        // redisClient.keys('*tours_*', (error, keys) => {
                        //     if (error) {
                        //         console.error('Error retrieving keys:', error)
                        //         return
                        //     }
                        //     // Insert new tour into each key individually
                        //     keys.forEach((key) => {
                        //         redisClient.get(key, (error, tour) => {
                        //             if (error) {
                        //                 console.error(`Error getting key ${key}:`, error)
                        //             } else {
                        //                 // console.log(`Key ${key} deleted successfully`)
                        //                 let arrayTours = JSON.parse(tour)
                        //                 let newArrayTour = [createTour.dataValues, ...arrayTours]
                        //                 redisClient.setEx(key, 3600, JSON.stringify(newArrayTour))
                        //             }
                        //         })
                        //     })
                        // })

                        redisClient.keys('*tours_*', (error, keys) => {
                            if (error) {
                                console.error('Error retrieving keys:', error)
                                return
                            }
                            // Delete each key individually
                            keys.forEach((key) => {
                                redisClient.del(key, (deleteError, reply) => {
                                    if (deleteError) {
                                        console.error(`Error deleting key ${key}:`, deleteError)
                                    } else {
                                        console.log(`Key ${key} deleted successfully`)
                                    }
                                })
                            })
                        })
                    }
                }
                await t.commit()
            })

        } catch (error) {
            resolve({
                status: StatusCodes.BAD_REQUEST,
                data: {
                    error: error.message,
                    msg: "Cannot clone new tour",
                }
            })
            // Rollback the transaction in case of an error
            if (transaction) {
                await transaction.rollback()
            }
            // reject(error)
        }
    });

const getAllTourManager = (
    { page, limit, order, tourName, address, tourStatus, status, routeId, tourGuideId, driverId, departureDate, endDate, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_manager_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}_${departureDate}_${endDate}`, async (error, tour) => {
                if (tour != null && tour != "") {
                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: "Got tours",
                            tours: JSON.parse(tour),
                        }
                    })
                } else {
                    const queries = { nest: true }
                    const offset = !page || +page <= 1 ? 0 : +page - 1
                    const flimit = +limit || +process.env.LIMIT_POST
                    queries.offset = offset * flimit
                    queries.limit = flimit
                    if (order) queries.order = [[order]]
                    else {
                        queries.order = [
                            ['updatedAt', 'DESC'],
                            [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                            [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, { model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                        ]
                    }
                    if (tourName) query.tourName = { [Op.substring]: tourName }
                    if (tourStatus) query.tourStatus = { [Op.eq]: tourStatus }
                    if (routeId) query.routeId = { [Op.eq]: routeId }
                    if (status) query.status = { [Op.eq]: status }
                    if (tourGuideId) query.tourGuideId = { [Op.eq]: tourGuideId }
                    if (driverId) query.driverId = { [Op.eq]: driverId }
                    if (departureDate) query.endBookingDate = { [Op.gte]: departureDate }
                    if (endDate) query.endBookingDate = { [Op.lte]: endDate }

                    const tours = await db.Tour.findAll({
                        where: query,
                        ...queries,
                        attributes: {
                            exclude: [
                                "routeId",
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
                    })

                    redisClient.setEx(`tours_manager_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}_${departureDate}_${endDate}`, 3600, JSON.stringify(tours))

                    resolve({
                        status: tours ? StatusCodes.OK : StatusCodes.NOT_FOUND,
                        data: {
                            msg: tours ? "Got tours" : "Tours not found!",
                            tours: tours,
                        }
                    })
                }
            })
        } catch (error) {
            reject(error)
        }
    })

const createTourDemo = () =>
    new Promise(async (resolve, reject) => {
        let transaction
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const station = await db.Route.findAll({
                    raw: true,
                    nest: true,
                    order: [
                        [{ model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                    ],
                    where: {
                        routeId: "5598c174-335b-441e-9151-25106f402ee4"
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
                })

                if (!station) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: "Route Id not found"
                        }
                    })
                    return
                }

                const uniqueStationArray = []

                // Loop through the JSON data and add station IDs to the array
                station.forEach(item => {
                    if (!uniqueStationArray.includes(item.route_segment.departureStationId)) {
                        uniqueStationArray.push(item.route_segment.departureStationId)
                    }
                    if (uniqueStationArray.includes(item.route_segment.endStationId)) {
                        uniqueStationArray.push(item.route_segment.endStationId)
                    }
                })

                const currentDate = new Date()

                const tDepartureDate = new Date();
                tDepartureDate.setHours(tDepartureDate.getHours() + 7);

                // Create a new Date object for tourBeginBookingDate
                const tourEndBookingDate = new Date(tDepartureDate);

                // Subtract 1 from the day of tourBeginBookingDate
                tourEndBookingDate.setDate(tourEndBookingDate.getDate() - 1);

                // Create a new Date object for tourBeginBookingDate
                const tourBeginBookingDate = new Date(tourEndBookingDate);

                // Subtract 1 from the day of tourBeginBookingDate
                tourBeginBookingDate.setDate(tourBeginBookingDate.getDate() - 3);

                const duration = "02:00:00";

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
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no buses available'
                        }
                    })
                    return
                }

                const findTourguide = await db.User.findAll({
                    raw: true, nest: true,
                    attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
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
                    attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
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
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no tour guide available'
                        }
                    })
                    return
                }

                if (findDriver.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no driver available'
                        }
                    })
                    return
                }

                const schedule = []
                if (findScheduledTour.length > 0) {
                    for (const tour of findScheduledTour) {
                        const tourGuide = tour.tour_tourguide
                        const driver = tour.tour_driver
                        const bus = tour.tour_bus

                        schedule.push({ tour, tourGuide, driver, bus })
                    }
                }

                // Find an available employee for the tour
                const availableTourGuide = findTourguide.filter(
                    (employee) =>
                        employee.maxTour > 0 &&
                        !schedule.some((assignment) => {
                            const beforeDepartureDate = new Date(assignment.tour.departureDate)
                            const departureDate = new Date(assignment.tour.departureDate)
                            // Split the duration string into hours, minutes, and seconds
                            let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                            hours += 1;

                            // Add the duration to the departureDate
                            departureDate.setHours(departureDate.getHours() + hours)
                            departureDate.setMinutes(departureDate.getMinutes() + minutes)
                            departureDate.setSeconds(departureDate.getSeconds() + seconds)
                            const endDate = departureDate

                            const beforeCurrentTourDepartureDate = new Date(tDepartureDate)
                            const currentTourDepartureDate = new Date(tDepartureDate)
                            const [currentTourHours, currentTourMinutes, currentTourSeconds] = duration.split(':').map(Number)

                            // Add the duration to the departureDate
                            currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                            currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                            currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                            const currentEndDate = currentTourDepartureDate

                            let checkTourGuide = true;
                            if (beforeDepartureDate > currentEndDate && assignment.tourGuide.userId === employee.userId) {
                                checkTourGuide = false;
                            }
                            // Check if the tour guide is available
                            return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide.userId === employee.userId) && checkTourGuide;
                        })
                );

                const availableDriver = findDriver.filter(
                    (employee) =>
                        employee.maxTour > 0
                        && !schedule.some((assignment) => {
                            const beforeDepartureDate = new Date(assignment.tour.departureDate)
                            const departureDate = new Date(assignment.tour.departureDate)
                            // Split the duration string into hours, minutes, and seconds
                            let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                            hours += 1;

                            // Add the duration to the departureDate
                            departureDate.setHours(departureDate.getHours() + hours)
                            departureDate.setMinutes(departureDate.getMinutes() + minutes)
                            departureDate.setSeconds(departureDate.getSeconds() + seconds)
                            const endDate = departureDate

                            const beforeCurrentTourDepartureDate = new Date(tDepartureDate)
                            const currentTourDepartureDate = new Date(tDepartureDate)
                            const [currentTourHours, currentTourMinutes, currentTourSeconds] = duration.split(':').map(Number)

                            // Add the duration to the departureDate
                            currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                            currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                            currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                            const currentEndDate = currentTourDepartureDate

                            let checkDriver = true;
                            if (beforeDepartureDate > currentEndDate && assignment.driver.userId === employee.userId) {
                                checkDriver = false;
                            }

                            // // Check if the driver is available
                            return (endDate >= beforeCurrentTourDepartureDate && assignment.driver.userId == employee.userId) && checkDriver;
                        })
                );

                const availableBuses = findBusActive.filter(
                    (bus) =>
                        // bus.numberSeat >= 2 && 
                        !schedule.some((assignment) => {
                            const beforeDepartureDate = new Date(assignment.tour.departureDate)
                            const departureDate = new Date(assignment.tour.departureDate)
                            // Split the duration string into hours, minutes, and seconds
                            let [hours, minutes, seconds] = assignment.tour.duration.split(':').map(Number)
                            hours += 1;

                            // Add the duration to the departureDate
                            departureDate.setHours(departureDate.getHours() + hours)
                            departureDate.setMinutes(departureDate.getMinutes() + minutes)
                            departureDate.setSeconds(departureDate.getSeconds() + seconds)
                            const endDate = departureDate

                            const beforeCurrentTourDepartureDate = new Date(tDepartureDate)
                            const currentTourDepartureDate = new Date(tDepartureDate)
                            const [currentTourHours, currentTourMinutes, currentTourSeconds] = duration.split(':').map(Number)

                            // Add the duration to the departureDate
                            currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                            currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                            currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                            const currentEndDate = currentTourDepartureDate

                            let checkBus = true;
                            if (beforeDepartureDate > currentEndDate && assignment.bus.busId == bus.busId) {
                                checkBus = false;
                            }

                            // Check if the bus is available
                            return (endDate >= beforeCurrentTourDepartureDate && assignment.bus.busId == bus.busId) && checkBus;
                        })
                );

                let createTour
                if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                    const chosenTourGuide = availableTourGuide[0]
                    const chosenDriver = availableDriver[0]
                    // chosenTourGuide.maxTour--
                    // chosenDriver.maxTour--
                    const chosenBus = availableBuses[0]

                    createTour = await db.Tour.create({
                        beginBookingDate: tourBeginBookingDate,
                        endBookingDate: tourEndBookingDate,
                        departureDate: tDepartureDate,
                        tourName: "Chuyến đi xa nhà thú vị cùng bạn bè ở Nha Trang",
                        departureStationId: uniqueStationArray[0],
                        tourGuideId: chosenTourGuide.userId,
                        driverId: chosenDriver.userId,
                        busId: chosenBus.busId,
                        isScheduled: true,
                        description: "Chuyến đi có cảnh đẹp",
                        routeId: "5598c174-335b-441e-9151-25106f402ee4",
                        duration: duration
                    }, { transaction: t })
                }
                else {
                    createTour = await db.Tour.create({
                        beginBookingDate: tourBeginBookingDate,
                        endBookingDate: tourEndBookingDate,
                        departureDate: tDepartureDate,
                        tourName: "Chuyến đi xa nhà thú vị cùng bạn bè ở Nha Trang",
                        departureStationId: uniqueStationArray[0],
                        description: "Chuyến đi có cảnh đẹp",
                        routeId: "5598c174-335b-441e-9151-25106f402ee4",
                        duration: duration
                    }, { transaction: t })
                }

                let isValidTickets = false
                const dependTickets = []
                const tickets = ["3355c24a-741c-4e3b-9d2a-fa43c4c950c5", "99f73c58-7c81-4152-90f9-21e50637e9c8"]
                const promises = tickets.map(async (ticketTypeId) => {
                    const ticketType = await db.TicketType.findOne({
                        raw: true,
                        where: {
                            ticketTypeId: ticketTypeId
                        },
                    })
                    if (!ticketType) {
                        await t.rollback()
                        resolve({
                            status: StatusCodes.NOT_FOUND,
                            data: {
                                msg: `Ticket type not found!`,
                            }
                        })
                    }
                    if (ticketType.dependsOnGuardian === 0) {
                        isValidTickets = true
                    } else {
                        dependTickets.push(ticketType.ticketTypeName)
                    }
                })

                await Promise.all(promises)

                if (!isValidTickets) {
                    await t.rollback()
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: `[${dependTickets}] need other guardian ticket to go with!`,
                        }
                    })
                } else {
                    const createTicketPromises = tickets.map(async (ticketTypeId) => {
                        const ticketType = await db.TicketType.findOne({
                            where: {
                                ticketTypeId: ticketTypeId
                            },
                        })
                        const price = await db.Price.findOne({
                            where: {
                                ticketTypeId: ticketType.ticketTypeId,
                            }
                        })
                        if (!price) {
                            await t.rollback()
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: `Ticket type doesn't have a price!`,
                                }
                            })
                        } else {
                            await db.Ticket.findOrCreate({
                                where: {
                                    ticketTypeId: ticketTypeId,
                                    tourId: createTour.tourId
                                },
                                defaults: { ticketTypeId: ticketTypeId, tourId: createTour.tourId, },
                                transaction: t,
                            })
                        }
                    })
                    await Promise.all(createTicketPromises)

                    if (createTour) {
                        await db.Image.create({
                            image: "https://storage.googleapis.com/wallet-fpt.appspot.com/ImageNhaTrang2.jpeg?GoogleAccessId=firebase-adminsdk-9ejw2%40wallet-fpt.iam.gserviceaccount.com&Expires=1705449600&Signature=D1ZSe31pvFjIV8H0btna1s0oHJLMJaj5qs6QROfQ98qmWaCSVXWxp6%2BEU2gq1s0J9%2BJE4NGcQABz3b%2B9FS32Mt72QjwEpDskmLNY2cGEUk8i0EMxBm06cjbw%2Bm2vxd%2F6F3%2FZ0iYidYTtQJ03OGuNEdwjfIRsq7PWZUL8LwASNaQ2Uwincd3kZFFjbIL9hi2QQaaIa1rWq5MTTxwoiCUEjop6XWJJnOUFwM4Yz0JS1HZZ39WNkR5Lw6b5iYXz2pTCnxeC1rcFtrVgMTwrXmizCOcdru25N246Dk9ZMdQK1%2Fgt5SKG0HIwA1D9m1PMZBJVKLAXnIaX3IBzOZtt4tQOqw%3D%3D",
                            tourId: createTour.tourId,
                        }, { transaction: t })

                        let index = 0
                        for (const stationId of uniqueStationArray) {
                            index += 1
                            await db.TourDetail.create({
                                tourId: createTour.tourId,
                                stationId: stationId,
                                index: index,
                            }, { transaction: t })
                        }
                    }

                    resolve({
                        status: createTour ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                        data: {
                            msg: createTour
                                ? "Create new tour successfully"
                                : "Cannot create new tour/Tour name already exists",
                            tour: createTour ? createTour.dataValues : null,
                            assignResult: availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0 && createTour
                                ? "Assign employee to tour successfully!"
                                : 'Cannot assign employee to tour',
                        }
                    })

                    redisClient.keys('*tours_*', (error, keys) => {
                        if (error) {
                            console.error('Error retrieving keys:', error)
                            return
                        }
                        // Delete each key individually
                        keys.forEach((key) => {
                            redisClient.del(key, (deleteError, reply) => {
                                if (deleteError) {
                                    console.error(`Error deleting key ${key}:`, deleteError)
                                } else {
                                    console.log(`Key ${key} deleted successfully`)
                                }
                            })
                        })
                    })
                }
                await t.commit()
            })
        } catch (error) {
            // Rollback the transaction in case of an error
            if (transaction) {
                await transaction.rollback()
            }
            reject(error)
        }
    })

module.exports = {
    updateTour,
    deleteTour,
    createTour,
    createTourByFile,
    getAllTour,
    getTourById,
    assignTour,
    cloneTour,
    getAllTourManager,
    createTourDemo,

}
