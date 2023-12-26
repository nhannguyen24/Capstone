const db = require('../models');
const { Op } = require('sequelize');
const { StatusCodes } = require('http-status-codes');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")
const TOUR_SCHEDULE_STATUS = require("../enums/TourScheduleStatusEnum")
const TRANSACTION_TYPE = require("../enums/TransactionTypeEnum")
const OTP_TYPE = require("../enums/OtpTypeEnum")
const PaymentService = require("./PaymentService")
const SortRouteSegmentUlti = require("../utils/SortRouteSegmentUlti")

const getBookingDetailByBookingId = async (bookingId) => {
    try {
        const booking = await db.Booking.findOne({
            raw: true,
            nest: true,
            where: {
                bookingId: bookingId
            },
            include: [
                {
                    model: db.User,
                    as: "booking_user",
                    attributes: ["userId", "userName", "email"]
                },
                {
                    model: db.Station,
                    as: "booking_departure_station",
                    attributes: ["stationId", "stationName", "address"]
                },
                {
                    model: db.Schedule,
                    as: "booking_schedule",
                    include: [
                        {
                            model: db.Tour,
                            as: "schedule_tour",
                        },
                        {
                            model: db.Bus,
                            as: "schedule_bus"
                        }
                    ]
                },
            ],
            attributes: {
                exclude: ["customerId", "departureStationId"]
            },
        })

        if (!booking) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Booking not found!`,
                }
            }
        }

        booking.isAttended = booking.isAttended === 1 ? true : false

        const bookingDetails = await db.BookingDetail.findAll({
            where: {
                bookingId: booking.bookingId
            },
            include: {
                model: db.Ticket,
                as: "booking_detail_ticket",
                include: [
                    {
                        model: db.TicketType,
                        as: "ticket_type",
                        attributes: {
                            exclude: ["status", "createdAt", "updatedAt"]
                        }
                    }
                ],
                attributes: {
                    exclude: ["tourId", "ticketTypeId", "createdAt", "updatedAt", "status"]
                }
            },
            attributes: {
                exclude: ["bookingId", "ticketId", "status", "bookingDetailId", "createdAt", "updatedAt"]
            },
        });

        const transaction = await db.Transaction.findOne({
            where: {
                bookingId: booking.bookingId
            },
            attributes: ["transactionId", "amount", "refundAmount", "transactionType", "status"]
        })

        booking.tickets = bookingDetails
        booking.transaction = transaction
        return {
            status: StatusCodes.OK,
            data: {
                msg: 'Get Booking detail successfully',
                booking: booking,
            },
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const getBookings = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const customerId = req.query.customerId || "";
        const customerName = req.query.customerName || "";
        const bookingCode = req.query.bookingCode || "";
        const startDate = req.query.startDate || "";
        const endDate = req.query.endDate || "";
        const tourId = req.query.tourId || "";
        const bookingStatus = req.query.bookingStatus || "";

        const whereClause = {};
        const whereClauseTour = {};
        const whereClauseUser = {};

        if (customerId.trim() !== "") {
            const user = await db.User.findOne({
                where: {
                    userId: customerId
                }
            });

            if (!user) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `User not found!`,
                    }
                }
            }
            whereClause.customerId = customerId;
        }

        if (customerName.trim() !== "") {
            whereClauseUser.userName = {
                [Op.substring]: customerName
            }
        }

        if (tourId.trim() !== "") {
            const tour = await db.Tour.findOne({
                where: {
                    tourId: tourId
                },
                attributes: ["tourId"]
            })
            if (!tour) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Tour not found!`,
                    }
                }
            } else {
                whereClauseTour.tourId = tourId
            }
        }

        if (bookingCode.trim() !== "") {
            whereClause.bookingCode = {
                [Op.substring]: bookingCode
            }
        }
        if (bookingStatus !== "") {
            whereClause.bookingStatus = bookingStatus
        }

        if (startDate !== "" && endDate !== "") {
            const _startDate = new Date(startDate)
            const _endDate = new Date(endDate)
            if (_startDate > _endDate) {
                whereClause.bookingDate = {
                    [Op.between]: [endDate + "T00:00:00.000Z", startDate + "T23:59:59.000Z"]
                }
            } else {
                whereClause.bookingDate = {
                    [Op.between]: [startDate + "T00:00:00.000Z", endDate + "T23:59:59.000Z"]
                }
            }
        } else {
            if (startDate !== "") {
                whereClause.bookingDate = {
                    [Op.gte]: startDate + "T00:00:00.000Z"
                }
            }
            if (endDate !== "") {
                whereClause.bookingDate = {
                    [Op.lte]: endDate + "T23:59:59.000Z"
                }
            }
        }

        const resultBookingDetails = await db.BookingDetail.findAll({
            raw: true,
            nest: true,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: whereClauseTour,
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: whereClause,
                    include: [
                        {
                            model: db.User,
                            as: "booking_user",
                            attributes: ["userId", "userName", "email"],
                            where: whereClauseUser
                        }
                    ],
                }
            ],
            attributes: ["bookingId"],
            group: "bookingId",
            limit: limit,
            offset: offset
        })

        const listBookingId = []
        const listBooking = []
        resultBookingDetails.map((bookingDetail) => {
            listBookingId.push(bookingDetail.detail_booking.bookingId)
        })

        if (listBookingId.length > 0) {
            const promises = listBookingId.map(async (bookingId) => {
                let filterBooking
                const filterBookingTicket = []
                const bookingDetails = await db.BookingDetail.findAll({
                    raw: true,
                    nest: true,
                    order: [
                        ["updatedAt", "DESC"]
                    ],
                    where: {
                        bookingId: bookingId
                    },
                    include: [
                        {
                            model: db.Ticket,
                            as: "booking_detail_ticket",
                            attributes: ["ticketId"],
                            include: {
                                model: db.TicketType,
                                as: "ticket_type",
                                attributes: ["ticketTypeId", "ticketTypeName", "description"]
                            }
                        },
                        {
                            model: db.Booking,
                            as: "detail_booking",
                            include: [
                                {
                                    model: db.User,
                                    as: "booking_user",
                                    attributes: ["userId", "userName", "email"],
                                },
                                {
                                    model: db.Station,
                                    as: "booking_departure_station",
                                    attributes: ["stationId", "stationName", "address"]
                                },
                                {
                                    model: db.Schedule,
                                    as: "booking_schedule",
                                    include: [
                                        {
                                            model: db.Tour,
                                            as: "schedule_tour",
                                        }, {
                                            model: db.Bus,
                                            as: "schedule_bus"
                                        }
                                    ]
                                },
                            ],
                            attributes: {
                                exclude: ["customerId", "departureStationId"]
                            },
                        }
                    ],
                    attributes: ["bookingId", "quantity", "ticketPrice"],
                })
                const transaction = await db.Transaction.findOne({
                    where: {
                        bookingId: bookingId
                    },
                    attributes: ["transactionId", "amount", "refundAmount", "transactionType", "status"]
                })
                if (bookingDetails.length > 1) {
                    for (let i = 0; i < bookingDetails.length; i++) {
                        const { detail_booking, bookingId, ...rest } = bookingDetails[i]
                        if (i == 0) {
                            detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                            filterBooking = detail_booking
                        }
                        filterBookingTicket.push(rest)
                    }
                    filterBooking.tickets = filterBookingTicket
                    filterBooking.transaction = transaction
                    listBooking.push(filterBooking)
                } else {
                    const { detail_booking, bookingId, ...rest } = bookingDetails[0]
                    detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                    filterBooking = detail_booking
                    filterBookingTicket.push(rest)
                    filterBooking.tickets = filterBookingTicket
                    filterBooking.transaction = transaction
                    listBooking.push(filterBooking)
                }
            })
            await Promise.all(promises);
        }

        const _bookingDetails = await db.BookingDetail.findAll({
            raw: true,
            nest: true,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: whereClauseTour,
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: whereClause,
                    order: [
                        ["updatedAt", "DESC"]
                    ],
                    include: [
                        {
                            model: db.User,
                            as: "booking_user",
                            attributes: ["userId", "userName", "email"],
                            where: whereClauseUser
                        }
                    ],
                }
            ],
            attributes: ["bookingId"],
            group: "bookingId",
        })

        const totalBooking = _bookingDetails.length
        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get Bookings successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalBooking
                },
                bookings: listBooking,
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const getBookingsByEmail = async (req) => {
    try {
        const email = req.query.email
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const bookingCode = req.query.bookingCode || ""
        const startDate = req.query.startDate || ""
        const endDate = req.query.endDate || ""
        const tourId = req.query.tourId || ""
        const bookingStatus = req.query.bookingStatus || ""

        let whereClause = {}
        let whereClauseTour = {}

        const user = await db.User.findOne({
            where: {
                email: email.replace(/\s/g, '').toLowerCase()
            }
        })

        if (!user) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Customer not found!`,
                }
            }
        }

        whereClause.customerId = user.userId

        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.GET_BOOKING_EMAIL,
                userId: user.userId
            }
        })

        if (!otp) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        if (!otp.isAllow) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        if (bookingCode.trim() !== "") {
            whereClause.bookingCode = {
                [Op.substring]: bookingCode
            }
        }

        if (tourId.trim() !== "") {
            const tour = await db.Tour.findOne({
                where: {
                    tourId: tourId
                },
                attributes: ["tourId"]
            })
            if (!tour) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Tour not found!`,
                    }
                }
            } else {
                whereClauseTour.tourId = tourId
            }
        }

        if (bookingStatus !== "") {
            whereClause.bookingStatus = bookingStatus
        }

        if (startDate !== "" && endDate !== "") {
            const _startDate = new Date(startDate)
            const _endDate = new Date(endDate)
            if (_startDate > _endDate) {
                whereClause.bookingDate = {
                    [Op.between]: [endDate + "T00:00:00.000Z", startDate + "T23:59:59.000Z"]
                }
            } else {
                whereClause.bookingDate = {
                    [Op.between]: [startDate + "T00:00:00.000Z", endDate + "T23:59:59.000Z"]
                }
            }
        } else {
            if (startDate !== "") {
                whereClause.bookingDate = {
                    [Op.gte]: startDate + "T00:00:00.000Z"
                }
            }
            if (endDate !== "") {
                whereClause.bookingDate = {
                    [Op.lte]: endDate + "T23:59:59.000Z"
                }
            }
        }

        const resultBookingDetails = await db.BookingDetail.findAll({
            raw: true,
            nest: true,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: whereClauseTour,
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: whereClause,
                    order: [
                        ["updatedAt", "DESC"]
                    ],
                    include: [
                        {
                            model: db.User,
                            as: "booking_user",
                        }
                    ],
                }
            ],
            attributes: ["bookingId"],
            group: "bookingId",
            limit: limit,
            offset: offset
        })

        const listBookingId = []
        const listBooking = []
        resultBookingDetails.map((bookingDetail) => {
            listBookingId.push(bookingDetail.detail_booking.bookingId)
        })
        if (listBookingId.length > 0) {
            const promises = listBookingId.map(async (bookingId) => {
                let filterBooking
                const filterBookingTicket = []
                const bookingDetails = await db.BookingDetail.findAll({
                    raw: true,
                    nest: true,
                    order: [
                        ["updatedAt", "DESC"]
                    ],
                    where: {
                        bookingId: bookingId
                    },
                    include: [
                        {
                            model: db.Ticket,
                            as: "booking_detail_ticket",
                            attributes: ["ticketId"],
                            include: {
                                model: db.TicketType,
                                as: "ticket_type",
                                attributes: ["ticketTypeId", "ticketTypeName", "description"]
                            }
                        },
                        {
                            model: db.Booking,
                            as: "detail_booking",
                            include: [
                                {
                                    model: db.User,
                                    as: "booking_user",
                                    attributes: ["userId", "userName", "email"],
                                },
                                {
                                    model: db.Station,
                                    as: "booking_departure_station",
                                    attributes: ["stationId", "stationName", "address"]
                                },
                                {
                                    model: db.Schedule,
                                    as: "booking_schedule",
                                    include: [
                                        {
                                            model: db.Tour,
                                            as: "schedule_tour",
                                        }, {
                                            model: db.Bus,
                                            as: "schedule_bus"
                                        }
                                    ]
                                },
                            ],
                            attributes: {
                                exclude: ["customerId", "departureStationId"]
                            },
                        }
                    ],
                    attributes: ["bookingId", "quantity", "ticketPrice"],
                })
                const transaction = await db.Transaction.findOne({
                    where: {
                        bookingId: bookingId
                    },
                    attributes: ["transactionId", "amount", "refundAmount", "transactionType", "status"]
                })
                if (bookingDetails.length > 1) {
                    for (let i = 0; i < bookingDetails.length; i++) {
                        const { detail_booking, bookingId, ...rest } = bookingDetails[i]
                        if (i == 0) {
                            detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                            filterBooking = detail_booking
                        }
                        filterBookingTicket.push(rest)
                    }
                    filterBooking.tickets = filterBookingTicket
                    filterBooking.transaction = transaction
                    listBooking.push(filterBooking)
                } else {
                    const { detail_booking, bookingId, ...rest } = bookingDetails[0]
                    detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                    filterBooking = detail_booking
                    filterBookingTicket.push(rest)
                    filterBooking.tickets = filterBookingTicket
                    filterBooking.transaction = transaction
                    listBooking.push(filterBooking)
                }
            })
            await Promise.all(promises);
        }
        const _bookingDetails = await db.BookingDetail.findAll({
            raw: true,
            nest: true,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: whereClauseTour,
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: whereClause,
                    order: [
                        ["updatedAt", "DESC"]
                    ],
                }
            ],
            attributes: ["bookingId"],
            group: "bookingId",
        })

        const totalBooking = _bookingDetails.length

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get bookings successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalBooking
                },
                bookings: listBooking
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const createBookingWeb = async (req) => {
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        const scheduleId = tickets[0].scheduleId
        let totalPrice = req.body.totalPrice
        const pickUpStationId = req.body.departureStationId
        /**
         * Checking if Admin or Manager not allow to book
         */
        const email = user.email.replace(/\s/g, '').toLowerCase()

        const resultUser = await db.User.findOrCreate({
            where: {
                email: email
            },
            defaults: { email: email, userName: user.userName, phone: user.phone, roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3" }
        })
        if ("58c10546-5d71-47a6-842e-84f5d2f72ec3" !== resultUser[0].dataValues.roleId) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Role not allow for this action!`,
                }
            }
        }

        /**
         * Checking if tour, departure station exist
         */
        let routeSegments = []
        const tourSchedule = await db.Schedule.findOne({
            where: {
                scheduleId: scheduleId
            },
            include: {
                model: db.Bus,
                as: "schedule_bus",
                attributes: ["busId", "numberSeat"]
            }
        })
        if (!tourSchedule) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour schedule not found!`,
                }
            }
        }
        if (TOUR_SCHEDULE_STATUS.AVAILABLE !== tourSchedule.scheduleStation && STATUS.ACTIVE !== tourSchedule.status) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour schedule not available for booking!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const tourDepartureDate = new Date(tourSchedule.departureDate)
        const checkAvailableBookingDate = tourDepartureDate - currentDate
        const oneDayInMillis = 24 * 60 * 60 * 1000

        if (checkAvailableBookingDate <= oneDayInMillis) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour schedule not available for booking!`,
                }
            }
        }

        //Check if pick up station is exist
        const station = await db.Station.findOne({
            where: {
                stationId: pickUpStationId
            }
        })

        if (!station) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found!`,
                }
            }
        }
        /** 
         * Check if pick up station is within the tour route
         */
        const tourDepartureStation = tourSchedule.departureStationId
        const routeSegment = await db.RouteSegment.findOne({
            raw: true,
            where: {
                tourId: tourSchedule.tourId,
                departureStationId: pickUpStationId,
                status: STATUS.ACTIVE,
            },
        })
        if (!routeSegment) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found within tour!`,
                }
            }
        }
        if (routeSegment.departureStationId !== tourDepartureStation) {
            const resultRouteSegments = await db.RouteSegment.findAll({
                raw: true,
                where: {
                    tourId: tourSchedule.tourId,
                },
            })

            if (resultRouteSegments.length === 0) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: "Tour route segments not found!"
                    }
                }
            }

            routeSegments = SortRouteSegmentUlti.sortRouteSegmentByDepartureStation(routeSegments, tourSchedule.departureStationId)
        }

        /**
         * Checking ticketId and priceId and calculate booked ticket quantity
         */
        const ticketList = []
        const dependTickets = []
        let seatBookingQuantity = 0
        let isValidTickets = false
        for (const ticket of tickets) {
            const _ticket = await db.Ticket.findOne({
                raw: true,
                nest: true,
                where: {
                    ticketId: ticket.ticketId,
                    tourId: tourSchedule.tourId
                },
                include: {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeName", "dependsOnGuardian"]
                }
            })

            if (!_ticket) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Ticket not found!`,
                    }
                }
            }
            seatBookingQuantity += ticket.quantity

            const price = await db.Price.findOne({
                raw: true,
                where: {
                    priceId: ticket.priceId,
                    ticketTypeId: _ticket.ticketTypeId
                }
            })
            if (!price) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Price not found!`,
                    }
                }
            }

            if (_ticket.ticket_type.dependsOnGuardian === 0) {
                isValidTickets = true
            } else {
                dependTickets.push(_ticket.ticket_type.ticketTypeName)
            }

            _ticket.price = price
            _ticket.quantity = ticket.quantity
            ticketList.push(_ticket)
        }
        //Check the booking information for the same tour and the same user
        const checkSameTourBookedBoking = await db.Booking.findOne({
            where: {
                customerId: resultUser[0].dataValues.userId,
                scheduleId: scheduleId,
                bookingStatus: {
                    [Op.eq]: BOOKING_STATUS.ON_GOING
                }
            },
        })

        //If not found => Check ticket is depend on guardian
        if (!checkSameTourBookedBoking) {
            if (!isValidTickets) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `[${dependTickets}] need other guardian ticket to go with!`,
                    }
                }
            }
        }
        /**
         * Begin checking available seat of a Bus
        */
        let totalBookedSeat = 0
        const bookingDetails = await db.BookingDetail.findAll({
            raw: true,
            nest: true,
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: {
                        tourId: tourSchedule.tourId,
                    },
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: {
                        bookingStatus: BOOKING_STATUS.ON_GOING
                    },
                    attributes: ["bookingId"]
                },
            ],
            attributes: ["bookingDetailId", "quantity"],
        })

        for (const bookingDetail of bookingDetails) {
            totalBookedSeat += bookingDetail.quantity
        }

        if (seatBookingQuantity + totalBookedSeat > tourSchedule.schedule_bus.numberSeat) {
            const availableSeats = tourSchedule.schedule_bus.numberSeat - totalBookedSeat;
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Seats available ${availableSeats}, but you requested ${seatBookingQuantity}`,
                }
            }
        }

        /**
         * Sending OTP 
        */
        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.BOOKING_TOUR,
                userId: resultUser[0].dataValues.userId
            }
        })

        if (!otp) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        if (!otp.isAllow) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        let totalDistance = 0
        let distanceToBookedDepartureStation = 0
        let includeInDistanceToBooked = true;
        if (routeSegments.length > 0) {
            for (const segment of routeSegments) {
                if (segment.distance === null || segment.distance === undefined) {
                    console.error(`RouteSegment ${segment.routeSegmentId} distance null!`)
                    return {
                        status: StatusCodes.INTERNAL_SERVER_ERROR,
                        data: {
                            msg: "An error has occurred while calculating totalPrice!",
                        }
                    }
                }
                //Sum up distance until departure station of this booking
                if (segment.departureStationId === routeSegment.departureStationId) {
                    includeInDistanceToBooked = false
                }
                if (includeInDistanceToBooked) {
                    distanceToBookedDepartureStation += parseFloat(segment.distance)
                }
                totalDistance += parseFloat(segment.distance)
            }

            //Calculate the remain distance
            const participateDistance = totalDistance - distanceToBookedDepartureStation

            // 1 = 100%
            let totalPricePercentage = 1
            if (participateDistance <= 1000) {
                //70% total price
                totalPricePercentage = totalPricePercentage - 0.3
            } else if (participateDistance <= 3000) {
                //80% total price
                totalPricePercentage = totalPricePercentage - 0.2
            }
            totalPrice = totalPrice * totalPricePercentage
        }
        totalPrice = Math.floor(totalPrice / 1000) * 1000
        /** 
         * Begin booking creation process and roll back if error
         */
        let booking
        try {
            await db.sequelize.transaction(async (t) => {
                booking = await db.Booking.create({ totalPrice: totalPrice, customerId: resultUser[0].dataValues.userId, departureStationId: pickUpStationId, scheduleId: scheduleId, bookingStatus: BOOKING_STATUS.DRAFT }, { transaction: t });

                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId, isPaidToManager: false, status: STATUS.DRAFT }, { transaction: t })

                for (const ticket of ticketList) {
                    await db.BookingDetail.create({ ticketPrice: ticket.price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId, quantity: ticket.quantity, status: STATUS.DRAFT }, { transaction: t });
                }
            })
        } catch (error) {
            console.error(error)
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                data: {
                    msg: "An error has occurred!",
                }
            }
        }

        return {
            status: StatusCodes.CREATED,
            data: {
                msg: "Please pay to finish booking process",
                bookingId: booking.bookingId,
                totalPrice: totalPrice
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const createBookingOffline = async (req) => {
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        const scheduleId = tickets[0].scheduleId
        let totalPrice = req.body.totalPrice
        const pickUpStationId = req.body.departureStationId
        /**
         * Checking if Admin or Manager not allow to book
         */
        let roleId
        let userId
        if (user.email !== null && user.email !== undefined && user.email.trim() !== "") {
            const email = user.email.replace(/\s/g, '').toLowerCase()
            const resultUser = await db.User.findOrCreate({
                where: {
                    email: email
                },
                defaults: { email: email, userName: user.userName, phone: user.phone, roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3" }
            })
            roleId = resultUser[0].dataValues.roleId
            userId = resultUser[0].userId
        } else {
            const resultUser = await db.User.create({ userName: user.userName, phone: user.phone, roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3" })
            roleId = "58c10546-5d71-47a6-842e-84f5d2f72ec3"
            userId = resultUser.userId
        }

        if ("58c10546-5d71-47a6-842e-84f5d2f72ec3" !== roleId) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Role not allow for this action`,
                }
            }
        }

        /**
         * Checking if tour, departure station exist
         */
        let routeSegments = []
        const tourSchedule = await db.Schedule.findOne({
            where: {
                scheduleId: scheduleId
            },
            include: {
                model: db.Bus,
                as: "schedule_bus",
                attributes: ["busId", "numberSeat"]
            }
        })
        if (!tourSchedule) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour schedule not found!`,
                }
            }
        }
        if (TOUR_SCHEDULE_STATUS.AVAILABLE !== tourSchedule.scheduleStation && STATUS.ACTIVE !== tourSchedule.status) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour schedule not available for booking!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        const departureDateMinusThirtyMinutes = new Date(tourSchedule.departureDate)
        departureDateMinusThirtyMinutes.setMinutes(departureDateMinusThirtyMinutes.getMinutes() - 30)
        if (departureDateMinusThirtyMinutes > currentDate) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour can only be booked after ${departureDateMinusThirtyMinutes.toISOString()}!`,
                }
            }
        }

        const station = await db.Station.findOne({
            where: {
                stationId: pickUpStationId
            }
        })

        if (!station) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found!`,
                }
            }
        }

        const tourDepartureStation = tourSchedule.departureStationId
        const routeSegment = await db.RouteSegment.findOne({
            raw: true,
            where: {
                tourId: tourSchedule.tourId,
                departureStationId: pickUpStationId,
                status: STATUS.ACTIVE,
            },
        })
        if (!routeSegment) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found within tour!`,
                }
            }
        }
        if (routeSegment.departureStationId !== tourDepartureStation) {
            const resultRouteSegments = await db.RouteSegment.findAll({
                raw: true,
                where: {
                    tourId: tourSchedule.tourId,
                },
            })

            if (resultRouteSegments.length === 0) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: "Tour route segments not found!"
                    }
                }
            }

            routeSegments = SortRouteSegmentUlti.sortRouteSegmentByDepartureStation(routeSegments, tourSchedule.departureStationId)
        }

        /**
         * Checking ticketId and priceId and calculate booked ticket quantity
         */
        const ticketList = []
        for (const ticket of tickets) {
            const _ticket = await db.Ticket.findOne({
                raw: true,
                nest: true,
                where: {
                    ticketId: ticket.ticketId,
                    tourId: tourSchedule.tourId
                },
                include: {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeName", "dependsOnGuardian"]
                }
            })

            if (!_ticket) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Ticket not found!`,
                    }
                }
            }

            const price = await db.Price.findOne({
                raw: true,
                where: {
                    priceId: ticket.priceId,
                    ticketTypeId: _ticket.ticketTypeId
                }
            })
            if (!price) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Price not found!`,
                    }
                }
            }

            _ticket.price = price
            _ticket.quantity = ticket.quantity
            ticketList.push(_ticket)
        }

        /**
         * Calculate distance for money
         */
        let totalDistance = 0
        let distanceToBookedDepartureStation = 0
        let includeInDistanceToBooked = true;
        if (routeSegments.length > 0) {
            for (const segment of routeSegments) {
                if (segment.distance === null || segment.distance === undefined) {
                    console.error(`RouteSegment ${segment.routeSegmentId} distance null!`)
                    return {
                        status: StatusCodes.INTERNAL_SERVER_ERROR,
                        data: {
                            msg: "An error has occurred while calculating totalPrice!",
                        }
                    }
                }
                //Sum up distance until departure station of this booking
                if (segment.departureStationId === routeSegment.departureStationId) {
                    includeInDistanceToBooked = false
                }
                if (includeInDistanceToBooked) {
                    distanceToBookedDepartureStation += parseFloat(segment.distance)
                }
                totalDistance += parseFloat(segment.distance)
            }

            //Calculate the remain distance
            const participateDistance = totalDistance - distanceToBookedDepartureStation

            // 1 = 100%
            let totalPricePercentage = 1
            if (participateDistance <= 1000) {
                //70% total price
                totalPricePercentage = totalPricePercentage - 0.3
            } else if (participateDistance <= 3000) {
                //80% total price
                totalPricePercentage = totalPricePercentage - 0.2
            }
            totalPrice = totalPrice * totalPricePercentage
        }
        totalPrice = Math.floor(totalPrice / 1000) * 1000
        /**
         * Begin booking creation process and roll back if error
         */
        let booking
        try {
            await db.sequelize.transaction(async (t) => {
                booking = await db.Booking.create({ totalPrice: totalPrice, customerId: userId, departureStationId: pickUpStationId, scheduleId: scheduleId, isAttended: false, bookingStatus: BOOKING_STATUS.DRAFT }, { transaction: t });

                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId, transactionType: TRANSACTION_TYPE.CASH, isPaidToManager: false, status: STATUS.DRAFT }, { transaction: t })

                for (const ticket of ticketList) {
                    await db.BookingDetail.create({ ticketPrice: ticket.price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId, quantity: ticket.quantity, status: STATUS.DRAFT }, { transaction: t });
                }
            })
        } catch (error) {
            console.error(error)
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                data: {
                    msg: "An error has occurred! While booking tickets offline",
                }
            }
        }

        return {
            status: StatusCodes.CREATED,
            data: {
                msg: "Please pay to finish booking process",
                bookingId: booking.bookingId,
                totalPrice: totalPrice
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const checkInQrCode = async (bookingId, scheduleId) => {
    const t = await db.sequelize.transaction();
    try {
        const tourSchedule = await db.Schedule.findOne({
            where: {
                scheduleId: scheduleId
            }
        })
        if (!tourSchedule) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour schedule not found!`,
                }
            }
        }
        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId,
            },
            include: {
                model: db.Schedule,
                as: "booking_schedule"
            }
        })

        if (!booking) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Booking not found!`,
                }
            }
        }
        if (booking.booking_schedule.scheduleId !== scheduleId) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking belong to different tour schedule!`,
                }
            }
        }
        if (BOOKING_STATUS.CANCELED === booking.bookingStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot take attendance because booking is canceled!`,
                }
            }
        }
        if (booking.isAttended === true) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking already attended!`,
                }
            }
        }
        if (TOUR_SCHEDULE_STATUS.FINISHED === booking.booking_schedule.scheduleStatus || TOUR_SCHEDULE_STATUS.CANCELED === booking.booking_schedule.scheduleStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot take attendance because tour is finished or canceled!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const thirtyMinutesBeforeDepartureDate = new Date(booking.booking_schedule.departureDate)
        thirtyMinutesBeforeDepartureDate.setMinutes(thirtyMinutesBeforeDepartureDate.getMinutes() - 30)
        if (thirtyMinutesBeforeDepartureDate > currentDate) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Check-in is allowed after ${thirtyMinutesBeforeDepartureDate.toISOString()}`,
                }
            }
        }

        await db.Booking.update({ isAttended: true }, {
            where: {
                bookingId: bookingId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()
        return {
            status: StatusCodes.OK,
            data: {
                msg: `Attendance taken successfully!`,
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const cancelBooking = async (bookingId) => {
    try {
        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            },
            include: [
                {
                    model: db.Transaction,
                    as: "booking_transaction"
                },
                {
                    model: db.Schedule,
                    as: "booking_schedule"
                }
            ]
        })

        if (!booking) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Booking not found!`,
                }
            }
        }

        if (BOOKING_STATUS.CANCELED === booking.bookingStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking already ${BOOKING_STATUS.CANCELED}!`,
                }
            }
        }

        if (STATUS.DRAFT === booking.bookingStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking not paid!`,
                }
            }
        }

        if (TOUR_SCHEDULE_STATUS.FINISHED === booking.booking_schedule.scheduleStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot cancel because tour finished!`,
                }
            }
        }

        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.CANCEL_BOOKING,
                userId: booking.userId
            }
        })
        if (!otp) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        if (!otp.isAllow) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            }
        }

        if (TRANSACTION_TYPE.PAY_OS === booking.booking_transaction.transactionType) {
            db.Booking.update({
                bookingStatus: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.BookingDetail.update({
                status: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.Transaction.update({
                status: STATUS.REFUNDED
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })
            return {
                status: StatusCodes.OK,
                data: {
                    msg: "Cancel booking successfully!",
                    refundAmount: 0,
                }
            }
        }

        var amount = parseInt(booking.booking_transaction.amount)
        const tourDepartureDate = new Date(booking.booking_schedule.departureDate)
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const timeDifference = tourDepartureDate - currentDate
        const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
        const oneDayInMillis = 24 * 60 * 60 * 1000 // 1 day in milliseconds
        if (timeDifference <= oneDayInMillis) {
            db.Booking.update({
                bookingStatus: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.BookingDetail.update({
                status: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.Transaction.update({
                status: STATUS.REFUNDED
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })
            return {
                status: StatusCodes.OK,
                data: {
                    msg: "Cancel booking successfully!",
                    refundAmount: 0
                }
            }
        } else if (timeDifference <= twoDaysInMillis) {
            amount = amount * 75 / 100
        } else {
            amount = amount * 80 / 100
        }

        const refundResult = await PaymentService.refundMomo(bookingId, amount)
        console.log(refundResult)
        if (refundResult === null || refundResult === undefined) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: "Something went wrong when canceling!",
                }
            }
        } else if (refundResult.status === StatusCodes.OK) {
            db.Booking.update({
                bookingStatus: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.BookingDetail.update({
                status: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })

            db.Transaction.update({
                refundAmount: refundResult.data.refundAmount,
                status: STATUS.REFUNDED
            }, {
                where: {
                    bookingId: bookingId
                },
                individualHooks: true,
            })
            return {
                status: StatusCodes.OK,
                data: {
                    msg: "Cancel booking successfully!",
                    refundAmount: refundResult.data.refundAmount,
                }
            }
        } else {
            return refundResult
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBookingWeb, createBookingOffline, checkInQrCode, cancelBooking };
