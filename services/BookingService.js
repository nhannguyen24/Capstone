const db = require('../models');
const { Op } = require('sequelize');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const OTP_TYPE = require("../enums/OtpTypeEnum")
const OtpService = require("./OtpService")
const PaymentService = require("./PaymentService")

const getBookingDetailByBookingId = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.id

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
                    attributes: ["userId", "userName"]
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
            resolve({
                status: 404,
                data: {
                    msg: `Booking not found with ID: ${bookingId}`,
                    booking: {}
                }
            });
            return
        }

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
                    exclude: ["tourId", "ticketTypeId", "createdAt", "updatedAt"]
                }
            },
            attributes: {
                exclude: ["bookingId", "ticketId"]
            },
        });

        const transaction = await db.Transaction.findOne({
            where: {
                bookingId: booking.bookingId
            },
            attributes: ["transactionId", "amount", "isSuccess", "status"]
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
        if (productOrder) {
            booking.booking_product = productOrder
        }

        booking.booking_detail = bookingDetails
        booking.booking_transaction = transaction
        resolve({
            status: 200,
            data: {
                msg: 'Get Booking detail successfully',
                booking: booking,
            },
        });
    } catch (error) {
        reject(error);
    }
});

const getBookings = (req) => new Promise(async (resolve, reject) => {
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
                resolve({
                    status: 404,
                    data: {
                        msg: `Customer not found with Id: ${customerId}`,
                    }
                });
                return;
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
                resolve({
                    status: 404,
                    data: {
                        msg: `Tour not found with Id: ${tourId}`,
                    }
                });
                return;
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
                    attributes: ["bookingId", "quantity"],
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
                    listBooking.push(filterBooking)
                } else {
                    const { detail_booking, bookingId, ...rest } = bookingDetails[0]
                    detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                    filterBooking = detail_booking
                    filterBookingTicket.push(rest)
                    filterBooking.tickets = filterBookingTicket
                    listBooking.push(filterBooking)
                }
            })
            await Promise.all(promises);
        }

        const totalBooking = resultBookingDetails.length

        resolve({
            status: 200,
            data: {
                msg: `Get Bookings successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalBooking
                },
                bookings: listBooking,
            }
        });
    } catch (error) {
        reject(error);
    }
});

const getBookingsByEmail = (req) => new Promise(async (resolve, reject) => {
    try {
        const email = req.query.email
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const bookingCode = req.query.bookingCode || "";
        const startDate = req.query.startDate || "";
        const endDate = req.query.endDate || "";
        const tourId = req.query.tourId || "";
        const bookingStatus = req.query.bookingStatus || "";

        let whereClause = {};
        let whereClauseTour = {};

        const user = await db.User.findOne({
            where: {
                email: email
            }
        })

        if (!user) {
            resolve({
                status: 404,
                data: {
                    msg: `Customer not found!`,
                }
            });
            return
        } else {
            whereClause.customerId = user.userId;
        }

        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.GET_BOOKING_EMAIL,
                userId: user.userId
            }
        })

        if (!otp) {
            const data = await OtpService.sendOtpToEmail(user.email, user.userId, user.userName, OTP_TYPE.GET_BOOKING_EMAIL)
            if (data) {
                resolve(data);
                return
            } else {
                resolve({
                    status: 409,
                    data: {
                        msg: `Mail sent failed`,
                    }
                });
                return
            }
        }

        if (!otp.isAllow) {
            resolve({
                status: 403,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            });
            return
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
                resolve({
                    status: 404,
                    data: {
                        msg: `Tour not found!`,
                    }
                });
                return;
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
                    attributes: ["bookingId", "quantity"],
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
                    listBooking.push(filterBooking)
                } else {
                    const { detail_booking, bookingId, ...rest } = bookingDetails[0]
                    detail_booking.isAttended = detail_booking.isAttended === 1 ? true : false
                    filterBooking = detail_booking
                    filterBookingTicket.push(rest)
                    filterBooking.tickets = filterBookingTicket
                    listBooking.push(filterBooking)
                }
            })
            await Promise.all(promises);
        }
        const totalBooking = resultBookingDetails.length

        resolve({
            status: 200,
            data: {
                msg: `Get bookings successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalBooking
                },
                bookings: listBooking
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createBooking = (req) => new Promise(async (resolve, reject) => {
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        const products = req.body.products || []
        const totalPrice = req.body.totalPrice
        const birthday = new Date(user.birthday)
        const departureStationId = req.body.departureStationId
        /**
         * Checking if Admin or Manager not allow to book
         */
        const resultUser = await db.User.findOrCreate({
            where: {
                email: user.email
            },
            defaults: { email: user.email, userName: user.userName, phone: user.phone, birthday: birthday, roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3" }
        })
        if ("58c10546-5d71-47a6-842e-84f5d2f72ec3" !== resultUser[0].dataValues.roleId) {
            resolve({
                status: 403,
                data: {
                    msg: `Role not allow for this action`,
                }
            });
            return
        }

        /**
         * Sending OTP if user not logged in
        */
        if (!req.user) {
            const otp = await db.Otp.findOne({
                where: {
                    otpType: OTP_TYPE.BOOKING_TOUR,
                    userId: resultUser[0].dataValues.userId
                }
            })

            if (!otp) {
                const data = await OtpService.sendOtpToEmail(resultUser[0].dataValues.email, resultUser[0].dataValues.userId, resultUser[0].dataValues.userName, OTP_TYPE.BOOKING_TOUR)
                if (data) {
                    resolve(data);
                    return
                } else {
                    resolve({
                        status: 409,
                        data: {
                            msg: `Mail sent failed`,
                        }
                    });
                    return
                }
            }

            if (!otp.isAllow) {
                resolve({
                    status: 403,
                    data: {
                        msg: `Action not allow, Please validate OTP!`,
                    }
                });
            }
        }

        /**
         * Checking if tour, departure station exist
         */
        let station
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
            resolve({
                status: 404,
                data: {
                    msg: `Tour not found with id: ${tickets[0].tourId}`,
                }
            });
        } else {
            if (TOUR_STATUS.AVAILABLE !== tour.tourStatus || STATUS.ACTIVE !== tour.status) {
                resolve({
                    status: 403,
                    data: {
                        msg: `Tour not available for booking!`,
                    }
                });
            }

            station = await db.Station.findOne({
                where: {
                    stationId: departureStationId
                }
            })

            if (!station) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Station not found!`,
                    }
                });
                return
            }
            const routeSegment = await db.RouteSegment.findAll({
                raw: true,
                nest: true,
                where: {
                    routeId: tour.routeId,
                    status: STATUS.ACTIVE,
                },
                order: [['index', 'ASC']]
            })

            if (!routeSegment || routeSegment.length === 0) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Station not found within tour route`,
                    }
                });
                return
            }
        }

        /**
         * Checking ticketId and priceId and calculate booked ticket quantity
         */
        let ticketList = []
        let seatBookingQuantity = 0
        for (const e of tickets) {
            const ticket = await db.Ticket.findOne({
                where: {
                    ticketId: e.ticketId,
                    tourId: tour.tourId
                }
            })
            if (!ticket) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Ticket not found!`,
                    }
                })
                return
            }
            seatBookingQuantity += e.quantity
            if (seatBookingQuantity > 6) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Can only booking maximum of 6 tickets`,
                    }
                })
                return
            }

            const price = await db.Price.findOne({
                where: {
                    priceId: e.priceId,
                }
            })
            if (!price) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Price not found!`,
                    }
                })
                return
            }
            ticket.dataValues.ticket_price = price
            ticketList.push(ticket)
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
            resolve({
                status: 400,
                data: {
                    msg: `Tickets available ${availableSeats}, but you requested ${seatBookingQuantity}`,
                }
            });
        }

        const productList = []
        for (const e of products) {
            const product = await db.Product.findOne({
                where: {
                    productId: e.productId
                },
                attributes: ["productId", "price"]
            })
            if (!product) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Product not found with Id: ${e.productId}`,
                    }
                });
            }
            if (STATUS.DEACTIVE === product.status) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Product not availale`,
                    }
                });
            }
            product.dataValues.quantity = e.quantity
            productList.push(product)
        }

        /**
         * Begin booking creation process and roll back if error
         */
        let booking
        try {
            await db.sequelize.transaction(async (t) => {
                booking = await db.Booking.create({ totalPrice: totalPrice, customerId: resultUser[0].dataValues.userId, departureStationId: station.stationId }, { transaction: t });

                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId }, { transaction: t })

                for (let index = 0; index < ticketList.length; index++) {
                    const e = ticketList[index];
                    await db.BookingDetail.create({ TicketPrice: e.dataValues.ticket_price.amount, bookingId: booking.bookingId, ticketId: e.dataValues.ticketId, quantity: tickets[index].quantity }, { transaction: t });
                }

                for (const e of productList) {
                    await db.ProductOrder.create({ productPrice: e.dataValues.price, quantity: e.dataValues.quantity, bookingId: booking.bookingId, productId: e.dataValues.productId }, { transaction: t });
                }
            })
        } catch (error) {
            console.log(error)
        }

        resolve({
            status: 201,
            data: {
                msg: "Please pay to finish booking process",
                bookingId: booking.bookingId
            }
        })

    } catch (error) {
        console.log(error)
        reject(error);
    }
});

const checkInQrCode = (bookingId) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
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
                        attributes: ["tourId", "tourStatus"]
                    }
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: {
                        bookingId: _bookingId
                    },
                }
            ]
        })

        if (!bookingDetail) {
            resolve({
                status: 404,
                data: {
                    msg: `Booking not found!`,
                }
            })
        }

        if (bookingDetail.detail_booking.isAttended === true) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking already attended!`,
                }
            })
        }

        if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
            resolve({
                status: 400,
                data: {
                    msg: `Cannot take attendance because booking is canceled!`,
                }
            })
        }
        if (TOUR_STATUS.FINISHED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus || TOUR_STATUS.CANCELED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
            resolve({
                status: 400,
                data: {
                    msg: `Cannot take attendance because tour is finished or canceled!`,
                }
            })
        }

        await db.Booking.update({ isAttended: true }, {
            where: {
                bookingId: _bookingId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()
        resolve({
            status: 200,
            data: {
                msg: `Attendance taken successfully!`,
            }
        })
    } catch (error) {
        await t.rollback()
        console.log(error)
        reject(error);
    }
});

const cancelBooking = (bookingId) => new Promise(async (resolve, reject) => {
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
                        attributes: ["tourId", "tourStatus"]
                    }
                },
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: {
                        bookingId: _bookingId
                    },
                    include: [
                        {
                            model: db.User,
                            as: "booking_user",
                            attributes: ["userId", "userName", "email"],
                        }
                    ],
                    attributes: {
                        exclude: ["customerId"]
                    },
                }
            ]
        })
        if (!bookingDetail) {
            resolve({
                status: 200,
                data: {
                    msg: `Booking not found!`,
                }
            })
        }

        if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking already ${BOOKING_STATUS.CANCELED}`,
                }
            })
        }

        if (TOUR_STATUS.FINISHED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus || TOUR_STATUS.AVAILABLE !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
            resolve({
                status: 400,
                data: {
                    msg: `Cannot cancel because tour finished or started`,
                }
            })
        }

        const transaction = await db.Transaction.findOne({
            where: {
                bookingId: _bookingId
            }
        })

        const userId = bookingDetail.detail_booking.booking_user.userId
        const email = bookingDetail.detail_booking.booking_user.email
        const userName = bookingDetail.detail_booking.booking_user.userName
        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.CANCEL_BOOKING,
                userId: bookingDetail.detail_booking.booking_user.userId
            }
        })
        if (!otp) {
            const data = await OtpService.sendOtpToEmail(email, userId, userName, OTP_TYPE.CANCEL_BOOKING)
            if (data) {
                resolve(data)
            } else {
                resolve({
                    status: 409,
                    data: {
                        msg: `Mail sent failed`,
                    }
                })
            }
        }

        if (!otp.isAllow) {
            resolve({
                status: 403,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            })
        }

        if (transaction.isSuccess === false) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking not paid!`,
                }
            })
        }

        PaymentService.refundMomo(_bookingId, (refundResult) => {
            console.log(refundResult)
            if (refundResult.status !== 200) {
                resolve(refundResult)
            } else {
                db.Booking.update({
                    bookingStatus: BOOKING_STATUS.CANCELED,
                }, {
                    where: {
                        bookingId: _bookingId
                    },
                    individualHooks: true,
                });

                db.Transaction.update({
                    refundAmount: refundResult.data.refundAmount,
                    status: STATUS.REFUNDED
                }, {
                    where: {
                        bookingId: _bookingId
                    },
                    individualHooks: true,
                });
                resolve(refundResult)
            }
        })
    } catch (error) {
        console.log(error)
        reject(error);
    }
});

module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBooking, checkInQrCode, cancelBooking };
