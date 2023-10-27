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
        const offset = parseInt((page - 1) * limit)
        const customerId = req.query.customerId || "";
        const customerName = req.query.customerName || "";
        const bookingCode = req.query.bookingCode || "";
        const tourId = req.query.tourId || "";
        const bookingStatus = req.query.bookingStatus || "";
        const status = req.query.status || "";
        // const orderDate = req.query.orderDate || "DESC";

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

        if (status !== "") {
            whereClause.status = status
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
        const offset = parseInt((page - 1) * limit)
        const bookingCode = req.query.bookingCode || "";
        const tourId = req.query.tourId || "";
        const bookingStatus = req.query.bookingStatus || "";
        const status = req.query.status || "";
        //const orderDate = req.query.orderDate || "DESC";

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
                    msg: `Customer not found with email: ${email}`,
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
                        msg: `Tour not found with Id: ${tourId}`,
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

        if (status !== "") {
            whereClause.status = status
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
                return
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
            return
        } else {
            if (TOUR_STATUS.NOT_STARTED !== tour.tourStatus || STATUS.ACTIVE !== tour.status) {
                resolve({
                    status: 403,
                    data: {
                        msg: `Tour already started, finished or deactive `,
                    }
                });
                return
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
                        msg: `Station not found with id: ${departureStationId}`,
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
                        msg: `Station not found within the tour route`,
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
                        msg: `Ticket not found with id: ${e.ticketId} of tour: ${tour.tourId}`,
                    }
                })
                return
            }
            seatBookingQuantity += e.quantity
            if (seatBookingQuantity > 6) {
                resolve({
                    status: 404,
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
                        msg: `Price not found with id: ${e.priceId}`,
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
            include: {
                model: db.Ticket,
                as: "booking_detail_ticket",
                where: {
                    tourId: tour.tourId,
                },
            },
            attributes: ["bookingDetailId", "quantity"],
            where: {
                status: STATUS.ACTIVE
            }
        })

        for (const e of bookingDetails) {
            totalBookedSeat += e.quantity
        }

        if (seatBookingQuantity + totalBookedSeat > tour.tour_bus.numberSeat) {
            const availableSeats = tour.tour_bus.numberSeat - totalBookedSeat;
            resolve({
                status: 400,
                data: {
                    msg: `There are not enough tickets available. The maximum quantity available is ${availableSeats}, but you requested ${seatBookingQuantity}`,
                }
            });
            return
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
                return
            }
            if (STATUS.DEACTIVE === product.status) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Product is Deactive`,
                    }
                });
                return
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
                msg: "Booking Tour Created. Please finish your payments",
                bookingId: booking.bookingId
            }
        })

    } catch (error) {
        console.log(error)
        reject(error);
    }
});

const updateBooking = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        /**
         * Checking bookingId exists
         */
        const bookingId = req.params.id
        //Get tour status
        const bookingDetail = await db.BookingDetail.findOne({
            where: {
                bookingId: bookingId
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
                        bookingId: bookingId
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
                    msg: `Booking not found with Id: ${bookingId}`,
                }
            })
            return
        }
        /**
         * Validate Booking Status
         */
        const updateBooking = {}
        var bookingStatus = req.query.bookingStatus || ""
        if (bookingStatus !== "") {
            if (bookingStatus === bookingDetail.detail_booking.bookingStatus) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Booking status is already ${bookingStatus}`,
                    }
                })
                return
            }
            //Check if tour is already finished
            if (TOUR_STATUS.FINISHED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Cannot update booking status because tour is finished`,
                    }
                })
                return
            }

            if (BOOKING_STATUS.ON_GOING === bookingStatus) {
                if (TOUR_STATUS.NOT_STARTED !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update booking status ${bookingStatus} because tour started`,
                        }
                    })
                    return
                }
            }

            if (BOOKING_STATUS.CANCELED === bookingStatus) {
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

                if (TOUR_STATUS.NOT_STARTED !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus ||
                    TOUR_STATUS.ON_TOUR !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update booking status ${bookingStatus} because tour started`,
                        }
                    })
                    return
                } else {
                    PaymentService.refundMomo(bookingId, (result) => {
                        if (result.status === 200) {
                            db.Booking.update({
                                bookingStatus: bookingStatus,
                            }, {
                                where: {
                                    bookingId: bookingId
                                },
                                individualHooks: true,
                            })
                        }
                        resolve(result)
                        return
                    });
                }
            }

            if (BOOKING_STATUS.FINISHED === bookingStatus) {
                if (TOUR_STATUS.FINISHED !== bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update booking status ${bookingStatus} because tour not finished`,
                        }
                    })
                    return
                }
            }
            updateBooking.bookingStatus = bookingStatus
        }

        var isAttended = req.query.isAttended || ""
        if (isAttended !== "") {
            if (isAttended === true && isAttended === bookingDetail.detail_booking.isAttended) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Customer is already Attended!`,
                    }
                })
                return
            }
            updateBooking.isAttended = isAttended
        }
        const updateBookingDetail = {}
        var status = req.query.status || ""
        if (status !== "") {
            if (status === bookingDetail.detail_booking.status) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Status is already ${status}`,
                    }
                })
                return
            }
            updateBooking.status = status
            updateBookingDetail.status = status
        }

        await db.Booking.update(updateBooking, {
            where: {
                bookingId: bookingId
            },
            individualHooks: true,
            transaction: t
        })

        await db.BookingDetail.update(updateBookingDetail, {
            where: {
                bookingId: bookingId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update booking successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        console.log(error)
        reject(error);
    }
});

const deleteBooking = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.id

        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            }
        })

        if (!booking) {
            resolve({
                status: 404,
                data: {
                    msg: `Booking not found with id ${bookingId}`,
                }
            })
            return
        }

        await db.Booking.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                bookingId: booking.bookingId
            },
            individualHooks: true,
        })

        await db.BookingDetail.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                bookingId: booking.bookingId
            },
            individualHooks: true,
        })

        resolve({
            status: 200,
            data: {
                msg: "Delete booking successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBooking, updateBooking, deleteBooking };
