const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")
const TRANSACTION_TYPE = require('../enums/TransactionTypeEnum')
const TOUR_SCHEDULE_STATUS = require("../enums/TourScheduleStatusEnum");
const BOOKING_STATUS = require("../enums/BookingStatusEnum");
const { StatusCodes } = require("http-status-codes");
const { sendNotification } = require("../utils/NotificationUtil");
const { sortRouteSegmentByDepartureStation } = require("../utils/SortRouteSegmentUlti");

const getAllSchedule = (
    { page, limit, order, busId, tourId, tourGuideId, driverId, status, departureDate, endDate, scheduleStatus, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}_${scheduleStatus}`, async (error, schedule) => {
                if (error) console.error(error);
                if (schedule != null && schedule != "" && roleName != 'Admin') {
                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: "Got schedules",
                            schedules: JSON.parse(schedule),
                        }
                    });
                } else {
                    redisClient.get(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}_${scheduleStatus}`, async (error, adminSchedule) => {
                        if (adminSchedule != null && adminSchedule != "") {
                            resolve({
                                status: StatusCodes.OK,
                                data: {
                                    msg: "Got schedules",
                                    schedules: JSON.parse(adminSchedule),
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
                            if (busId) query.busId = { [Op.eq]: busId };
                            if (tourId) query.tourId = { [Op.eq]: tourId };
                            if (tourGuideId) query.tourGuideId = { [Op.eq]: tourGuideId };
                            if (driverId) query.driverId = { [Op.eq]: driverId };
                            if (status) query.status = { [Op.eq]: status };
                            if (scheduleStatus) query.scheduleStatus = { [Op.eq]: scheduleStatus };
                            if (departureDate) {
                                const startTimeConvert = new Date(departureDate);
                                query.departureDate = { [Op.gte]: startTimeConvert };
                            }
                            if (endDate) {
                                const endTimeConvert = new Date(endDate);
                                query.endDate = { [Op.lte]: endTimeConvert };
                            }
                            const schedules = await db.Schedule.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: [
                                        "busId",
                                        "tourId",
                                        "tourGuideId",
                                        "driverId",
                                    ],
                                },
                                include: [
                                    {
                                        model: db.Tour,
                                        as: "schedule_tour",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
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
                                                        include: {
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
                                                    }
                                                ]
                                            },
                                        ]
                                    },
                                    {
                                        model: db.TourDetail,
                                        as: "schedule_detail",
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
                                                as: "tour_detail_station",
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
                                        attributes: {
                                            exclude: [
                                                "password",
                                                "birthday",
                                                "address",
                                                "refreshToken",
                                                "accessChangePassword",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.User,
                                        as: "schedule_driver",
                                        attributes: {
                                            exclude: [
                                                "password",
                                                "birthday",
                                                "address",
                                                "refreshToken",
                                                "accessChangePassword",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.Tracking,
                                        as: "schedule_tracking",
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

                            await Promise.all(schedules.map(async (schedule) => {
                                const routeSegments = await db.RouteSegment.findAll({
                                    nest: true,
                                    where: {
                                        tourId: schedule.schedule_tour.tourId
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
                            }))

                            if (roleName !== "Admin") {
                                redisClient.setEx(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}_${scheduleStatus}`, 3600, JSON.stringify(schedules));
                            } else {
                                redisClient.setEx(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}_${scheduleStatus}`, 3600, JSON.stringify(schedules));
                            }
                            resolve({
                                status: StatusCodes.OK,
                                data: {
                                    msg: schedules ? "Got schedules" : "Cannot find schedules",
                                    schedules: schedules,
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
    })

const getScheduleTransactionList = async (tourGuideId, isPaidToManager) => {
    try {
        const tourGuide = await db.User.findOne({
            where: {
                userId: tourGuideId
            }
        })

        if (!tourGuide) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: "Tour guide not found!",
                }
            }
        }

        const tourSchedules = await db.Schedule.findAll({
            where: {
                tourGuideId: tourGuideId,
                scheduleStatus: TOUR_SCHEDULE_STATUS.FINISHED
            },
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "schedule_booking",
                    attributes: ["bookingId"],
                    include: {
                        model: db.Transaction,
                        as: "booking_transaction",
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "bookingId"]
                        },
                        where: {
                            transactionType: TRANSACTION_TYPE.CASH,
                            isPaidToManager: isPaidToManager,
                            status: STATUS.PAID,
                        }
                    }
                }, {
                    model: db.User,
                    as: "schedule_tourguide",
                    attributes: ["userId", "userName", "phone"]
                }
            ]
        })

        const filteredSchedules = []
        tourSchedules.map((schedule) => {
            if (schedule.schedule_booking.length > 0) {
                const { schedule_booking, ...rest } = schedule.dataValues
                let paidBackPrice = 0

                schedule_booking.map((booking) => {
                    paidBackPrice += booking.booking_transaction.amount
                })
                rest.paidBackPrice = paidBackPrice
                filteredSchedules.push(rest)
            }
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get schedule transaction list successfully`,
                isPaidToManager: isPaidToManager === "true" ? true : false,
                schedules: filteredSchedules
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "Something went wrong while fetching transactions!"
            }
        }
    }
}

const getScheduleTransactionDetail = async (scheduleId) => {
    try {
        const tourSchedule = await db.Schedule.findOne({
            where: {
                scheduleId: scheduleId
            }
        })
        // if (!tourSchedule) {
        //     return {
        //         status: StatusCodes.NOT_FOUND,
        //         data: {
        //             msg: "Tour schedule not found!"
        //         }
        //     }
        // }

        const bookings = await db.Booking.findAll({
            where: {
                scheduleId: scheduleId
            },
            include: [
                {
                    model: db.Transaction,
                    as: "booking_transaction",
                    where: {
                        transactionType: TRANSACTION_TYPE.CASH,
                        status: STATUS.PAID
                    },
                }
            ]
        })

        let isPaidToManager = true
        let paidBackPrice = 0

        bookings.map((booking) => {
            if (booking.booking_transaction.isPaidToManager === false) {
                isPaidToManager = false
            }

            paidBackPrice += booking.totalPrice
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get schedule transaction detail successfully`,
                paidBackInfo: {
                    paidBackPrice: paidBackPrice,
                    isPaidToManager: isPaidToManager,
                },
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "Something went wrong while fetching transactions!"
            }
        }
    }
}

const getScheduleById = (scheduleId) =>
    new Promise(async (resolve, reject) => {
        try {
            const schedule = await db.Schedule.findAll({
                where: { scheduleId: scheduleId },
                nest: true,
                attributes: {
                    exclude: ["busId", "tourId", "tourGuideId", "driverId", "createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
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
                                        include: {
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
                                    }
                                ]
                            },
                        ]
                    },
                    {
                        model: db.TourDetail,
                        as: "schedule_detail",
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
                                as: "tour_detail_station",
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
                        attributes: {
                            exclude: [
                                "password",
                                "birthday",
                                "address",
                                "refreshToken",
                                "accessChangePassword",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.User,
                        as: "schedule_driver",
                        attributes: {
                            exclude: [
                                "password",
                                "birthday",
                                "address",
                                "refreshToken",
                                "accessChangePassword",
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.Tracking,
                        as: "schedule_tracking",
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

            for (const scheduleObj of schedule) {
                const routeSegments = await db.RouteSegment.findAll({
                    nest: true,
                    where: {
                        tourId: scheduleObj.schedule_tour.tourId
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

                const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(routeSegments, scheduleObj.departureStationId);
                scheduleObj.dataValues.route_segment = routeSegmentsSortByDepartureStation;
            }
            resolve({
                status: StatusCodes.OK,
                data: {
                    msg: schedule.length > 0 ? "Got schedule" : `Cannot find schedule with id: ${scheduleId}`,
                    schedule: schedule,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createSchedule = (body) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
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

                const findCurrentTourDuration = await db.Tour.findOne({
                    where: { tourId: body.tourId },
                    raw: true,
                    nest: true,
                    attributes: {
                        exclude: ["status", "createdAt", "updatedAt"],
                    }
                });

                let createSchedule, availableTourGuide, availableDriver, availableBuses;
                const BeforeTDepartureDate = new Date(body.departureDate)
                const tDepartureDate = new Date(body.departureDate)
                const [currentScheduleHours, currentScheduleMinutes, currentScheduleSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                // Add the duration to the tDepartureDate
                tDepartureDate.setHours(tDepartureDate.getHours() + currentScheduleHours)
                tDepartureDate.setMinutes(tDepartureDate.getMinutes() + currentScheduleMinutes)
                tDepartureDate.setSeconds(tDepartureDate.getSeconds() + currentScheduleSeconds)
                const tEndDate = tDepartureDate

                if (currentDate.getTime() + 24 * 60 * 60 * 1000 >= BeforeTDepartureDate.getTime()) {
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

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkTourGuide = true;
                                if (departureDate > currentEndDate && assignment.tourGuide?.userId === employee.userId) {
                                    checkTourGuide = false;
                                }

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

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

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

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

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
                            departureStationId: body.departureStationId,
                            tourGuideId: chosenTourGuide.userId,
                            driverId: chosenDriver.userId,
                            busId: chosenBus.busId,
                            isScheduled: true,
                            tourId: body.tourId,
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

                        const createdDepartureDate = new Date(body.departureDate);

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
                            body: `Chuyến tên ${findCurrentTourDuration.tourName} - ${formattedDate}`,
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
                            body: `Chuyến tên ${findCurrentTourDuration.tourName} - ${formattedDate}`,
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
                    }
                    else {
                        createSchedule = await db.Schedule.create({
                            departureDate: BeforeTDepartureDate,
                            endDate: tEndDate,
                            departureStationId: body.departureStationId,
                            tourId: body.tourId,
                        }, { transaction: t })
                    }

                    if (createSchedule) {
                        const routeSegments = await db.RouteSegment.findAll({
                            raw: true, nest: true,
                            where: {
                                tourId: body.tourId
                            },
                            order: [
                                ['index', 'ASC']
                            ],
                            attributes: {
                                exclude: [
                                    "createdAt",
                                    "updatedAt",
                                    "status",
                                ],
                            },
                        })

                        const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(routeSegments, body.departureStationId);
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

                    resolve({
                        status: createSchedule ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                        data: {
                            msg: createSchedule
                                ? "Create new schedule successfully"
                                : "Cannot create new schedule",
                            schedule: createSchedule ? createSchedule.dataValues : null,
                        }
                    });
                    redisClient.keys('*schedules_*', (error, keys) => {
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
            })

        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
            reject(error);
        }
    });

const updateSchedule = (id, body) =>
    new Promise(async (resolve, reject) => {
        let transaction
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const currentDate = new Date()
                currentDate.setHours(currentDate.getHours() + 7)
                const tDepartureDate = new Date(body.departureDate)

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
                    let tourGuide = body.tourGuideId;
                    let driver = body.driverId;
                    let bus = body.busId;

                    const findSchedule = await db.Schedule.findOne({
                        raw: true, nest: true,
                        where: {
                            scheduleId: id
                        },
                        attributes: {
                            exclude: ["status", "createdAt", "updatedAt"]
                        },
                        include: [
                            {
                                model: db.Tour,
                                as: "schedule_tour",
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

                    if (!findSchedule) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: `Cannot find schedule with id: ${id}`,
                            }
                        })
                        return
                    }

                    let tEndDate = findSchedule.schedule_tour.endDate;
                    if (body.departureDate) {
                        const tDepartureDateForChange = new Date(body.departureDate)
                        const durationCurrentTour = findSchedule.schedule_tour.duration
                        const [currentScheduleHours, currentScheduleMinutes, currentScheduleSeconds] = durationCurrentTour.split(':').map(Number)

                        // Add the duration to the tDepartureDate
                        tDepartureDateForChange.setHours(tDepartureDateForChange.getHours() + currentScheduleHours)
                        tDepartureDateForChange.setMinutes(tDepartureDateForChange.getMinutes() + currentScheduleMinutes)
                        tDepartureDateForChange.setSeconds(tDepartureDateForChange.getSeconds() + currentScheduleSeconds)
                        tEndDate = tDepartureDateForChange
                    }

                    if (tourGuide) {
                        const findScheduledTourGuild = await db.Schedule.findAll({
                            raw: true, nest: true,
                            order: [['departureDate', 'ASC']],
                            where: {
                                [Op.and]: [
                                    {
                                        departureDate: {
                                            [Op.gte]: currentDate,
                                        },
                                    },
                                    {
                                        endDate: {
                                            [Op.gte]: currentDate,
                                        },
                                    }
                                ],
                                isScheduled: true,
                                tourGuideId: body.tourGuideId
                            },
                        })

                        const checkDuplicatedTime = findScheduledTourGuild.some((assignment) => {
                            const departureDate = new Date(assignment.departureDate)
                            const endDate = new Date(assignment.endDate)

                            const currentTourDepartureDate = new Date(findSchedule.departureDate)
                            const currentEndDate = new Date(findSchedule.endDate)

                            // Check if the tour guide is duplicated
                            return endDate >= currentTourDepartureDate || departureDate <= currentEndDate;
                        })

                        if (checkDuplicatedTime) {
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: "Tour guide time is duplicated",
                                }
                            })
                            return
                        }
                    } else if (driver) {
                        const findScheduledDriver = await db.Schedule.findAll({
                            raw: true, nest: true,
                            order: [['departureDate', 'ASC']],
                            where: {
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
                                driverId: body.driverId
                            },
                        })

                        const checkDuplicatedTime = findScheduledDriver.some((assignment) => {
                            const departureDate = new Date(assignment.departureDate)
                            const endDate = new Date(assignment.endDate)

                            const currentTourDepartureDate = new Date(findSchedule.departureDate)
                            const currentEndDate = new Date(findSchedule.endDate)

                            // Check if the tour guide is duplicated
                            return endDate >= currentTourDepartureDate || departureDate <= currentEndDate;
                        })
                        if (checkDuplicatedTime) {
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: "Driver time is duplicated",
                                }
                            })
                            return
                        }
                    } else if (bus) {
                        const findScheduledBus = await db.Schedule.findAll({
                            raw: true, nest: true,
                            order: [['departureDate', 'ASC']],
                            where: {
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
                                busId: body.busId
                            },
                        })

                        const checkDuplicatedTime = findScheduledBus.some((assignment) => {
                            const departureDate = new Date(assignment.departureDate)
                            const endDate = new Date(assignment.endDate)

                            const currentTourDepartureDate = new Date(findSchedule.departureDate)
                            const currentEndDate = new Date(findSchedule.endDate)

                            // Check if the tour guide is duplicated
                            return endDate >= currentTourDepartureDate || departureDate <= currentEndDate;
                        })
                        if (checkDuplicatedTime) {
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: "Bus time is duplicated",
                                }
                            })
                            return
                        }
                    }

                    if (body.departureDate || body.departureStationId || body.tourId) {
                        const booking = db.Booking.findAll({
                            raw: true, nest: true,
                            where: { scheduleId: id }
                        })
                        if (booking.length > 0) {
                            resolve({
                                status: StatusCodes.BAD_REQUEST,
                                data: {
                                    msg: "Cannot update departureDate, departureStationId of schedule because there is customer book this tour's schedule",
                                }
                            })
                            return
                        }

                        let currentTourId = findSchedule.schedule_tour.tourId
                        const routeSegments = await db.RouteSegment.findAll({
                            raw: true, nest: true,
                            where: {
                                tourId: currentTourId
                            },
                            order: [
                                ['index', 'ASC']
                            ],
                            attributes: {
                                exclude: [
                                    "createdAt",
                                    "updatedAt",
                                    "status",
                                ],
                            },
                        })

                        const routeSegmentsSortByDepartureStation = sortRouteSegmentByDepartureStation(routeSegments, body.departureStationId);
                        let uniqueStationArray = [];
                        routeSegmentsSortByDepartureStation.forEach(item => {
                            if (!uniqueStationArray.includes(item.departureStationId)) {
                                uniqueStationArray.push(item.departureStationId)
                            }
                            if (uniqueStationArray.includes(item.endStationId)) {
                                uniqueStationArray.push(item.endStationId)
                            }
                        })

                        await db.TourDetail.destroy({
                            where: {
                                scheduleId: id
                            }, transaction: t
                        })

                        let index = 0
                        for (const stationId of uniqueStationArray) {
                            index += 1
                            await db.TourDetail.create({
                                scheduleId: id,
                                stationId: stationId,
                                index: index,
                            }, { transaction: t })
                        }
                    }

                    if (body.scheduleStatus == TOUR_SCHEDULE_STATUS.STARTED) {
                        await db.TourDetail.update({
                            status: STATUS.NOTARRIVED,
                        }, {
                            where: { scheduleId: id, },
                            individualHooks: true,
                            transaction: t
                        })
                    }

                    if (body.scheduleStatus == TOUR_SCHEDULE_STATUS.FINISHED) {
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

                    const schedules = await db.Schedule.update({
                        endDate: tEndDate,
                        ...body
                    }, {
                        where: { scheduleId: id },
                        individualHooks: true,
                    });

                    resolve({
                        status: schedules[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                        data: {
                            msg:
                                schedules[1].length !== 0
                                    ? `Schedule update`
                                    : "Cannot update schedule/ scheduleId not found",
                        }
                    });

                    redisClient.keys('*schedules_*', (error, keys) => {
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
                await t.commit()
            })
        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
            console.log(error);
            reject(error);
        }
    });

const deleteSchedule = (scheduleIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findSchedule = await db.Schedule.findAll({
                raw: true, nest: true,
                where: { scheduleId: scheduleIds },
            });

            for (const schedulent of findSchedule) {
                if (schedulent.status === "Deactive") {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: "The schedule already deactive!",
                        }
                    });
                }
            }

            const schedules = await db.Schedule.update(
                { status: "Deactive" },
                {
                    where: { scheduleId: scheduleIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: schedules[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                data: {
                    msg:
                        schedules[0] > 0
                            ? `${schedules[0]} schedule delete`
                            : "Cannot delete schedule/ scheduleId not found",
                }
            });

            redisClient.keys('*schedules_*', (error, keys) => {
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
    updateSchedule,
    deleteSchedule,
    createSchedule,
    getAllSchedule,
    getScheduleById,
    getScheduleTransactionList,
    getScheduleTransactionDetail
};

