const db = require('../models');
const { Op } = require('sequelize');
const { StatusCodes } = require('http-status-codes');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const TRANSACTION_TYPE = require("../enums/TransactionTypeEnum")
const OTP_TYPE = require("../enums/OtpTypeEnum")
const OtpService = require("./OtpService")
const PaymentService = require("./PaymentService")

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
                    attributes: ["stationId", "stationName"]
                }
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
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "beginBookingDate", "endBookingDate"]
                        },
                        include: {
                            model: db.Bus,
                            as: "tour_bus"
                        }
                    },
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

        const productOrder = await db.ProductOrder.findAll({
            where: {
                bookingId: booking.bookingId
            },
            attributes: ["productPrice", "quantity"],
            include: {
                model: db.Product,
                as: "order_product",
                attributes: ["productName"],
            }
        })
        if (productOrder.length === 0) {
            booking.booking_product = productOrder
        }

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
            data:{
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
                        msg: `Customer not found!`,
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

        let tour
        if (tourId.trim() !== "") {
            tour = await db.Tour.findOne({
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
                            include: [
                                {
                                    model: db.Tour,
                                    as: "ticket_tour",
                                    attributes: {
                                        exclude: ["createdAt", "updatedAt", "beginBookingDate", "endBookingDate", "departureStationId", "isScheduled"]
                                    },
                                    include: {
                                        model: db.Bus,
                                        as: "tour_bus",
                                    }
                                },
                                {
                                    model: db.TicketType,
                                    as: "ticket_type",
                                    attributes: ["ticketTypeId", "ticketTypeName", "description"]
                                }
                            ]
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
                                    attributes: ["stationId", "stationName"]
                                }
                            ],
                            attributes: {
                                exclude: ["customerId", "departureStationId"]
                            },
                        }
                    ],
                    attributes: ["bookingId", "quantity", "TicketPrice"],
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
            data:{
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

        let tour
        if (tourId.trim() !== "") {
            tour = await db.Tour.findOne({
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
                            include: [
                                {
                                    model: db.Tour,
                                    as: "ticket_tour",
                                    attributes: {
                                        exclude: ["createdAt", "updatedAt", "beginBookingDate", "endBookingDate", "departureStationId", "isScheduled"]
                                    },
                                    include: {
                                        model: db.Bus,
                                        as: "tour_bus",
                                    }
                                },
                                {
                                    model: db.TicketType,
                                    as: "ticket_type",
                                    attributes: ["ticketTypeId", "ticketTypeName", "description"]
                                }
                            ]
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
                                    attributes: ["stationId", "stationName"]
                                }
                            ],
                            attributes: {
                                exclude: ["customerId", "departureStationId"]
                            },
                        }
                    ],
                    attributes: ["bookingId", "quantity", "TicketPrice"],
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
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const createBookingWeb = async (req) => {
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        const products = req.body.products || []
        let totalPrice = req.body.totalPrice
        const departureStationId = req.body.departureStationId
        const paymentType = req.body.paymentType
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


        /**
         * Checking if tour, departure station exist
         */
        let station
        let _routeSegment
        let _routeSegments = []
        const tour = await db.Tour.findOne({
            where: {
                tourId: tickets[0].tourId,
            },
            include: {
                model: db.Bus,
                as: "tour_bus",
                attributes: ["busId", "numberSeat"]
            }
        })
        if (!tour) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour not found!`,
                }
            }
        }
        if (TOUR_STATUS.AVAILABLE !== tour.tourStatus && STATUS.ACTIVE !== tour.status) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Tour not available for booking!`,
                }
            }
        }

        station = await db.Station.findOne({
            where: {
                stationId: departureStationId
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

        const routeSegment = await db.RouteSegment.findOne({
            raw: true,
            where: {
                routeId: tour.routeId,
                departureStationId: departureStationId,
                status: STATUS.ACTIVE,
            },
        })
        if (!routeSegment) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found within tour route`,
                }
            }
        } else {
            if (routeSegment.index !== 1) {
                const routeSegments = await db.RouteSegment.findAll({
                    raw: true,
                    where: {
                        routeId: routeSegment.routeId,
                    },
                    order: [['index', 'ASC']]
                })
                _routeSegments = routeSegments
            }
            _routeSegment = routeSegment
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
                    tourId: tour.tourId
                },
                include: {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeName","dependsOnGuardian"]
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

            if(_ticket.ticket_type.dependsOnGuardian === 0){
                isValidTickets = true
            } else {
                dependTickets.push(_ticket.ticket_type.ticketTypeName)
            }

            _ticket.price = price
            _ticket.quantity = ticket.quantity
            ticketList.push(_ticket)
        }

        if(!isValidTickets){
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `[${dependTickets}] need other guardian ticket to go with!`,
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
                        tourId: tour.tourId,
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

        for (const e of bookingDetails) {
            totalBookedSeat += e.quantity
        }

        if (seatBookingQuantity + totalBookedSeat > tour.tour_bus.numberSeat) {
            const availableSeats = tour.tour_bus.numberSeat - totalBookedSeat;
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tickets available ${availableSeats}, but you requested ${seatBookingQuantity}`,
                }
            }
        }

        const productList = []
        for (const e of products) {
            const product = await db.Product.findOne({
                raw: true,
                where: {
                    productId: e.productId
                },
                attributes: ["productId", "price"]
            })
            if (!product) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Product not found!`,
                    }
                }
            }
            if (STATUS.DEACTIVE === product.status) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Product not availale!`,
                    }
                }
            }
            product.quantity = e.quantity
            productList.push(product)
        }

        let totalDistance = 0
        let distanceToBookedDepartureStation = 0
        let discountPrice = 0
        if (_routeSegments.length > 0) {
            for (const segment of _routeSegments) {
                if (segment.index < _routeSegment.index) {
                    distanceToBookedDepartureStation += parseFloat(segment.distance)
                }
                totalDistance += parseFloat(segment.distance)
            }

            for (const ticket of ticketList) {
                const pricePerMeter = (ticket.price.amount * ticket.quantity) / parseFloat(totalDistance)
                discountPrice = discountPrice + (distanceToBookedDepartureStation * pricePerMeter)
            }

            for (const product of productList) {
                discountPrice += (product.quantity * product.price)
            }
            totalPrice = discountPrice
        }

        /** 
         * Begin booking creation process and roll back if error
         */
        let booking
        try {
            await db.sequelize.transaction(async (t) => {
                booking = await db.Booking.create({ totalPrice: totalPrice, customerId: resultUser[0].dataValues.userId, departureStationId: station.stationId, bookingStatus: BOOKING_STATUS.DRAFT }, { transaction: t });

                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId, transactionType: paymentType, status: STATUS.DRAFT }, { transaction: t })

                for (const ticket of ticketList) {
                    await db.BookingDetail.create({ ticketPrice: ticket.price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId, quantity: ticket.quantity, status: STATUS.DRAFT }, { transaction: t });
                }

                for (const e of productList) {
                    await db.ProductOrder.create({ productPrice: e.dataValues.price, quantity: e.dataValues.quantity, bookingId: booking.bookingId, productId: e.dataValues.productId }, { transaction: t });
                }
            })
        } catch (error) {
            console.error(error)
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                data:{
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
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const createBookingOffline = async (req) => {
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        let totalPrice = req.body.totalPrice
        const departureStationId = req.body.departureStationId
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
        let station
        let _routeSegment
        let _routeSegments = []
        const tour = await db.Tour.findOne({
            where: {
                tourId: tickets[0].tourId,
            },
            include: {
                model: db.Bus,
                as: "tour_bus",
                attributes: ["busId", "numberSeat"]
            }
        })
        if (!tour) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour not found!`,
                }
            }
        }

        if (TOUR_STATUS.FINISHED === tour.tourStatus || TOUR_STATUS.CANCELED === tour.tourStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour not available for booking!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        const departureDateMinusThirtyMinutes = new Date(tour.departureDate)
        departureDateMinusThirtyMinutes.setMinutes(departureDateMinusThirtyMinutes.getMinutes() - 30)
        if(departureDateMinusThirtyMinutes > currentDate){
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tour can only be booked 30 minutes before departure time!`,
                }
            }
        }

        station = await db.Station.findOne({
            where: {
                stationId: departureStationId
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

        const routeSegment = await db.RouteSegment.findOne({
            raw: true,
            where: {
                routeId: tour.routeId,
                departureStationId: departureStationId,
                status: STATUS.ACTIVE,
            },
        })

        if (!routeSegment) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Station not found within tour route`,
                }
            }
        }
        if (routeSegment.index !== 1) {
            const routeSegments = await db.RouteSegment.findAll({
                raw: true,
                where: {
                    routeId: routeSegment.routeId,
                },
                order: [['index', 'ASC']]
            })
            _routeSegments = routeSegments
        }
        _routeSegment = routeSegment

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
                    tourId: tour.tourId
                },
                include: {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeName","dependsOnGuardian"]
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

            if(_ticket.ticket_type.dependsOnGuardian === 0){
                isValidTickets = true
            } else {
                dependTickets.push(_ticket.ticket_type.ticketTypeName)
            }

            _ticket.price = price
            _ticket.quantity = ticket.quantity
            ticketList.push(_ticket)
        }

        if(!isValidTickets){
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `[${dependTickets}] need other guardian ticket to go with!`,
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
                        tourId: tour.tourId,
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

        for (const e of bookingDetails) {
            totalBookedSeat += e.quantity
        }

        if (seatBookingQuantity + totalBookedSeat > tour.tour_bus.numberSeat) {
            const availableSeats = tour.tour_bus.numberSeat - totalBookedSeat;
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Tickets available ${availableSeats}, but you requested ${seatBookingQuantity}`,
                }
            }
        }

        /**
         * Calculate distance for money
         */
        let totalDistance = 0
        let distanceToBookedDepartureStation = 0
        if (_routeSegments.length > 0) {
            for (const segment of _routeSegments) {
                if (segment.index < _routeSegment.index) {
                    distanceToBookedDepartureStation += parseFloat(segment.distance)
                }
                totalDistance += parseFloat(segment.distance)
            }
            const discountPercentage = parseFloat(distanceToBookedDepartureStation) / parseFloat(totalDistance)
            /**
             * 0.5 = 50%
             */
            if (discountPercentage !== 0) {
                if (discountPercentage >= 0.5) {
                    totalPrice = totalPrice * discountPercentage
                } else {
                    totalPrice = totalPrice * discountPercentage
                }
            }
        }
        /**
         * Begin booking creation process and roll back if error
         */
        let booking
        try {
            await db.sequelize.transaction(async (t) => {
                booking = await db.Booking.create({ totalPrice: totalPrice, customerId: userId, departureStationId: station.stationId, isAttended: false, bookingStatus: BOOKING_STATUS.DRAFT }, { transaction: t });

                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId, transactionType: TRANSACTION_TYPE.CASH, status: STATUS.DRAFT }, { transaction: t })

                for (const ticket of ticketList) {
                    await db.BookingDetail.create({ ticketPrice: ticket.price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId, quantity: ticket.quantity, status: STATUS.DRAFT }, { transaction: t });
                }
            })
        } catch (error) {
            console.error(error)
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                data:{
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
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const checkInQrCode = async (bookingId, tourId) => {
    const t = await db.sequelize.transaction();
    try {
        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })
        if (!tour) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour not found!`,
                }
            }
        }
        const bookingDetail = await db.BookingDetail.findOne({
            attributes: ["bookingDetailId"],
            where: {
                bookingId: bookingId
            },
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    attributes: ["ticketId"],
                    include: {
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: ["tourId", "departureDate", "tourStatus"],
                    }
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                }
            ]
        })

        if (!bookingDetail) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Booking not found!`,
                }
            }
        }
        if (bookingDetail.booking_detail_ticket.ticket_tour.tourId !== tourId) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Booking belong to different tour!`,
                }
            }
        }
        if (TOUR_STATUS.FINISHED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus && TOUR_STATUS.CANCELED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Cannot take attendance because tour is finished or canceled!`,
                }
            }
        }
        if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Cannot take attendance because booking is canceled!`,
                }
            }
        }
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const thirtyMinutesBeforeDepartureDate = new Date(bookingDetail.booking_detail_ticket.ticket_tour.departureDate)
        thirtyMinutesBeforeDepartureDate.setMinutes(thirtyMinutesBeforeDepartureDate.getMinutes() - 30)
        if (thirtyMinutesBeforeDepartureDate > currentDate) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Check-in is allowed only 30 minutes before the tour departure time.`,
                }
            }
        }

        if (bookingDetail.detail_booking.isAttended === true) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: `Booking already attended!`,
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
            data:{
                msg: "An error has occurred!",
            }
        }
    }
};

const cancelBooking = async (bookingId) => {
    try {
        const _bookingId = bookingId
        const bookingDetail = await db.BookingDetail.findOne({
            where: {
                bookingId: _bookingId
            },
            attributes: ["bookingDetailId"],
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    attributes: ["ticketId"],
                    include: {
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: ["tourId", "tourName", "departureDate", "tourStatus"],
                    }
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    include: [
                        {
                            model: db.User,
                            as: "booking_user",
                            attributes: ["userId"],
                        }
                    ],
                    attributes: {
                        exclude: ["customerId"]
                    },
                }
            ]
        })
        if (!bookingDetail) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Booking not found!`,
                }
            }
        }

        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.CANCEL_BOOKING,
                userId: bookingDetail.detail_booking.booking_user.userId
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

        if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking already ${BOOKING_STATUS.CANCELED}!`,
                }
            }
        }
        const transaction = await db.Transaction.findOne({
            where: {
                bookingId: _bookingId
            }
        })

        if (STATUS.DRAFT === transaction.status) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Booking not paid!`,
                }
            }
        }
        if (TOUR_STATUS.AVAILABLE !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot cancel because tour finished or started!`,
                }
            }
        }

        var amount = parseInt(transaction.amount)
        const departureDate = new Date(bookingDetail.booking_detail_ticket.ticket_tour.departureDate)
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const timeDifference = departureDate - currentDate
        const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
        const oneDayInMillis = 24 * 60 * 60 * 1000 // 1 day in milliseconds
        if (timeDifference <= oneDayInMillis) {
            db.Booking.update({
                bookingStatus: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: _bookingId
                },
                individualHooks: true,
            })

            db.BookingDetail.update({
                status: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: _bookingId
                },
                individualHooks: true,
            })

            db.Transaction.update({
                status: STATUS.REFUNDED
            }, {
                where: {
                    bookingId: _bookingId
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


        const refundResult = await PaymentService.refundMomo(_bookingId, amount)
        //const refundResult = await PaymentService.refundMomo(_bookingId, amount)
        if (refundResult === null || refundResult === undefined) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: "Something went wrong when canceling!",
                }
            }
        } else if (refundResult.status === StatusCodes.OK) {
            console.log("Update Refund")
            db.Booking.update({
                bookingStatus: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: _bookingId
                },
                individualHooks: true,
            })

            db.BookingDetail.update({
                status: BOOKING_STATUS.CANCELED,
            }, {
                where: {
                    bookingId: _bookingId
                },
                individualHooks: true,
            })

            db.Transaction.update({
                refundAmount: refundResult.data.refundAmount,
                status: STATUS.REFUNDED
            }, {
                where: {
                    bookingId: _bookingId
                },
                individualHooks: true,
            })
            return {
                status: StatusCodes.OK,
                data: {
                    msg: "Booking canceled successfully!",
                    refundAmount: refundResult.data.refundAmount,
                }
            }
        } else {
            console.log("Failed to refund", refundResult)
            return refundResult
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBookingWeb, createBookingOffline, checkInQrCode, cancelBooking };
