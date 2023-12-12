const db = require("../models")
const { Op } = require("sequelize")
const redisClient = require("../config/RedisConfig")
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const readXlsxFile = require('read-excel-file/node')
const { StatusCodes } = require("http-status-codes")
const { sendNotification } = require("../utils/NotificationUtil")
const fs = require('fs');

const getAllTour = (
    { page, limit, order, tourName, address, tourStatus, status, routeId, tourGuideId, driverId, departureDate, endDate, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}_${departureDate}_${endDate}`, async (error, tour) => {
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
                    if (departureDate) query.departureDate = { [Op.gte]: departureDate }
                    if (endDate) query.departureDate = { [Op.lte]: endDate }

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
                        if (SPECIAL_DAY.includes(dateMonth)) {
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

                        const departureDate = new Date(tour.departureDate)
                        // Split the duration string into hours, minutes, and seconds
                        const [hours, minutes, seconds] = tour.duration.split(':').map(Number)

                        // Add the duration to the departureDate
                        departureDate.setHours(departureDate.getHours() + hours)
                        departureDate.setMinutes(departureDate.getMinutes() + minutes)
                        departureDate.setSeconds(departureDate.getSeconds() + seconds)
                        // Now, departureDate holds the endTime
                        const endDate = departureDate.toISOString()
                        tour.dataValues.endDate = endDate

                        const departureStation = await db.Station.findOne({
                            where: {
                                stationId: tour.departureStationId,
                            },
                            attributes: {
                                exclude: [
                                    "createdAt",
                                    "updatedAt",
                                    "status",
                                ]
                            }
                        })
                        tour.dataValues.departureStation = departureStation
                        delete tour.dataValues.departureStationId

                        const feedbacks = await db.Feedback.findAll({
                            raw: true,
                            nest: true,
                            where: {
                                routeId: tour.tour_route.routeId,
                                status: STATUS.ACTIVE
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
                                    tourId: tour.tourId
                                },
                                attributes: []
                            },
                            attributes: [
                                [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'total_quantity'],
                            ]
                        })
                        if (tour.tour_bus !== null) {
                            if (booking[0].total_quantity === null) {
                                tour.dataValues.availableSeats = tour.tour_bus.numberSeat
                            } else {
                                tour.dataValues.availableSeats = tour.tour_bus.numberSeat - parseInt(booking[0].total_quantity)
                            }
                        } else {
                            tour.dataValues.availableSeats = 0
                        }
                    }

                    redisClient.setEx(`tours_${page}_${limit}_${order}_${tourName}_${tourStatus}_${status}_${routeId}_${tourGuideId}_${driverId}_${departureDate}_${endDate}`, 3600, JSON.stringify(tours))

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
                    [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, 'index', 'ASC'],
                    [{ model: db.Route, as: 'tour_route' }, { model: db.RouteSegment, as: 'route_segment' }, { model: db.RoutePointDetail, as: 'segment_route_poi_detail' }, 'index', 'ASC']
                ],
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
                                                include: [
                                                    {
                                                        model: db.Image,
                                                        as: "poi_image",
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
                                                    }
                                                ]
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
                if (SPECIAL_DAY.includes(dateMonth)) {
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

                const departureDate = new Date(tour.departureDate)
                // Split the duration string into hours, minutes, and seconds
                const [hours, minutes, seconds] = tour.duration.split(':').map(Number)

                // Add the duration to the departureDate
                departureDate.setHours(departureDate.getHours() + hours)
                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                // Now, departureDate holds the endTime
                const endDate = departureDate.toISOString()
                tour.dataValues.endDate = endDate

                const feedbacks = await db.Feedback.findAll({
                    where: {
                        routeId: tour.tour_route.routeId,
                        status: STATUS.ACTIVE
                    },
                    include: {
                        model: db.User,
                        as: "feedback_user",
                        attributes: ["userId", "userName", "avatar"]
                    },
                    attributes: {
                        exclude: ["userId"]
                    }
                })

                tour.dataValues.feedbacks = feedbacks

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
                            tourId: tour.tourId
                        },
                        attributes: []
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'total_quantity'],
                    ]
                })

                if (tour.tour_bus !== null) {
                    if (booking[0].total_quantity === null) {
                        tour.dataValues.availableSeats = tour.tour_bus.numberSeat
                    } else {
                        tour.dataValues.availableSeats = tour.tour_bus.numberSeat - parseInt(booking[0].total_quantity)
                    }
                } else {
                    tour.dataValues.availableSeats = 0
                }
            }

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
                currentDate.setHours(currentDate.getHours() + 7)
                const tDepartureDate = new Date(body.departureDate)
                const tourBeginBookingDate = new Date(body.beginBookingDate)
                const tourEndBookingDate = new Date(body.endBookingDate)

                // if (currentDate > tourBeginBookingDate) {
                //     resolve({
                //         status: StatusCodes.BAD_REQUEST,
                //         data: {
                //             msg: "Begin booking date can't be equal or earlier than current date"
                //         }
                //     })
                //     return
                // } else if (tourBeginBookingDate >= tourEndBookingDate) {
                //     resolve({
                //         status: StatusCodes.BAD_REQUEST,
                //         data: {
                //             msg: "Begin booking date can't be equal or later than End booking date",
                //         }
                //     })
                //     return
                // } else if (tourEndBookingDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                //     resolve({
                //         status: StatusCodes.BAD_REQUEST,
                //         data: {
                //             msg: "End booking date must be 24 hours earlier than Departure date",
                //         }
                //     })
                //     return
                // }
                // else {
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

                                // console.log('beforeCurrentTourDepartureDate', beforeCurrentTourDepartureDate);
                                // console.log('endDate', endDate);
                                // console.log('beforeDepartureDate', beforeDepartureDate);
                                // console.log('currentEndDate', currentEndDate);

                                // console.log(`${assignment.tourGuide.userId}////${employee.userId}`, (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide.userId === employee.userId) && checkTourGuide);

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
                                description: body.description,
                                routeId: body.routeId,
                                duration: body.duration,
                            },
                            transaction: t,
                        })

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

                        const createdDepartureDate = new Date(createTour[0].dataValues.departureDate);

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
                            userId: createTour[0].dataValues.tourGuideId
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
                            userId: createTour[0].dataValues.driverId
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
                                description: body.description,
                                routeId: body.routeId,
                                duration: body.duration,
                            },
                            transaction: t,
                        })
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

                            let day = DAY_ENUM.NORMAL

                            const tourDepartureDate = new Date(createTour[0].departureDate)
                            const dayOfWeek = tourDepartureDate.getDay()
                            if (dayOfWeek === 0 || dayOfWeek === 6) {
                                day = DAY_ENUM.WEEKEND
                            }
                            const date = tourDepartureDate.getDate()
                            const month = tourDepartureDate.getMonth()
                            const dateMonth = `${date}-${month}`
                            if (SPECIAL_DAY.includes(dateMonth)) {
                                day = DAY_ENUM.HOLIDAY
                            }

                            const price = await db.Price.findOne({
                                where: {
                                    ticketTypeId: ticketType.ticketTypeId,
                                    day: day,
                                }
                            })
                            if (!price) {
                                await t.rollback()
                                resolve({
                                    status: StatusCodes.BAD_REQUEST,
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

                            let index = 0
                            for (const stationId of uniqueStationArray) {
                                index += 1
                                await db.TourDetail.create({
                                    tourId: createTour[0].tourId,
                                    stationId: stationId,
                                    index: index,
                                }, { transaction: t })
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
                // }
                await t.commit()
            })

        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback()
            }
            reject(error)
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

                    let day = DAY_ENUM.NORMAL

                    const dayOfWeek = tour.departureDate.getDay()
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        day = DAY_ENUM.WEEKEND
                    }
                    const date = tour.departureDate.getDate()
                    const month = tour.departureDate.getMonth()
                    const dateMonth = `${date}-${month}`
                    if (SPECIAL_DAY.includes(dateMonth)) {
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
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback()
            }
            reject(error)
        }
    })

const updateTour = (id, { images, ...body }) =>
    new Promise(async (resolve, reject) => {
        let transaction
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const tour = await db.Tour.findOne({
                    where: {
                        tourName: body?.tourName,
                        tourId: {
                            [Op.ne]: id
                        }
                    }
                })

                if (tour !== null) {
                    resolve({
                        status: StatusCodes.CONFLICT,
                        data: {
                            msg: "Tour name already exists"
                        }
                    })
                } else {
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
                        let tourGuide = body.tourGuideId
                        let driver = body.driverId
                        const findTour = await db.Tour.findOne({
                            raw: true, nest: true,
                            where: {
                                tourId: id
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
                                const departureDate = new Date(assignment.departureDate)
                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours)
                                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                const endDate = departureDate

                                // Check if the tour guide is available
                                return endDate >= findTour.departureDate
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
                                const departureDate = new Date(assignment.departureDate)
                                // Split the duration string into hours, minutes, and seconds
                                const [hours, minutes, seconds] = assignment.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                departureDate.setHours(departureDate.getHours() + hours)
                                departureDate.setMinutes(departureDate.getMinutes() + minutes)
                                departureDate.setSeconds(departureDate.getSeconds() + seconds)
                                const endDate = departureDate

                                // Check if the tour guide is available
                                return endDate >= findTour.departureDate
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
                        }

                        let departureStation = body.routeId
                        let station
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
                            })
                        }

                        const tours = await db.Tour.update({
                            departureStationId: departureStation ? station.route_segment.stationId : findTour.departureStationId,
                            beginBookingDate: body.beginBookingDate ? tourBeginBookingDate : findTour.beginBookingDate,
                            endBookingDate: body.tourEndBookingDate ? tourEndBookingDate : findTour.tourEndBookingDate,
                            departureDate: body.tDepartureDate ? tDepartureDate : findTour.tDepartureDate,
                            ...body
                        }, {
                            where: { tourId: id, },
                            individualHooks: true,
                            transaction: t
                        })

                        if (body.tourStatus == TOUR_STATUS.STARTED) {
                            await db.TourDetail.update({
                                status: STATUS.NOTARRIVED,
                            }, {
                                where: { tourId: id, },
                                individualHooks: true,
                                transaction: t
                            })
                        }

                        if (body.tourStatus == TOUR_STATUS.FINISHED) {
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

                    }
                }
                await t.commit()
            })
        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
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
        let transaction
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

                            let day = DAY_ENUM.NORMAL

                            const tourDepartureDate = new Date(createTour.dataValues.departureDate)
                            const dayOfWeek = tourDepartureDate.getDay()
                            if (dayOfWeek === 0 || dayOfWeek === 6) {
                                day = DAY_ENUM.WEEKEND
                            }
                            const date = tourDepartureDate.getDate()
                            const month = tourDepartureDate.getMonth()
                            const dateMonth = `${date}-${month}`
                            if (SPECIAL_DAY.includes(dateMonth)) {
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
                                    status: StatusCodes.CONFLICT,
                                    data: {
                                        msg: `Ticket type doesn't have a price for day ${day}`,
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
            // reject(error)
        }
    });

// const createTourTest = () => {
//     new Promise(async (resolve, reject) => {
//         try {
//             const sqlQuery = fs.readFileSync('path/to/your/query.sql', 'utf8');
//             db.sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT })
//                 .then(results => {
//                     console.log(results);
//                 })
//                 .catch(error => {
//                     console.error(error);
//                 });
//         } catch (error) {

//         }
//     })
// }

module.exports = {
    updateTour,
    deleteTour,
    createTour,
    createTourByFile,
    getAllTour,
    getTourById,
    assignTour,
    cloneTour,

}
