const db = require('../models');
const { Op } = require('sequelize');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const OTP_TYPE = require("../enums/OtpTypeEnum")
const mailer = require("../utils/MailerUtil")
const OtpService = require("./OtpService")
const qr = require('qrcode');

const getBookingDetailByBookingId = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.id
        if (bookingId === undefined || bookingId === null || bookingId.trim().length < 1) {
            resolve({
                status: 400,
                data: {
                    msg: `bookingId required`,
                    booking: {}
                }
            });
            return
        }

        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            }
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
        });

        resolve({
            status: 200,
            data: {
                msg: 'Get Booking detail successfully',
                bookingDetails: bookingDetails,
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
        const bookingCode = req.query.bookingCode || "";
        const bookingStatus = req.query.bookingStatus || "";
        const status = req.query.status || "";
        const orderDate = req.query.orderDate || DESC;

        const whereClause = {};

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

        const bookings = await db.Booking.findAll({
            where: whereClause,
            order: [
                ["bookingDate", orderDate],
                ["updatedAt", "DESC"]
            ],
            limit: limit,
            offset: offset
        });

        resolve({
            status: 200,
            data: {
                msg: `Get Bookings successfully`,
                paging: {
                    page: page,
                    limit: limit
                },
                bookings: bookings,
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
        const bookingCode = req.query.bookingCode.trim() || "";
        const bookingStatus = req.query.bookingStatus || "";
        const status = req.query.status || "";
        const orderDate = req.query.orderDate || DESC;

        let whereClause = {};

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

        if (bookingCode !== "") {
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

        const bookings = await db.Booking.findAll({
            where: whereClause,
            order: [
                ["bookingDate", orderDate],
                ["updatedAt", orderDate]
            ],
            limit: limit,
            offset: offset
        });

        resolve({
            status: 200,
            data: {
                msg: `Get bookings successfully`,
                paging: {
                    page: page,
                    limit: limit
                },
                bookings: bookings
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
            const routeSegment = await db.RouteSegment.findOne({
                where: {
                    routeId: tour.routeId,
                    departureStationId: station.stationId
                }
            })
            if (!routeSegment) {
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
         * Checking tourId, ticketId and priceId and calculate booked ticket quantity
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
            include: {
                model: db.Ticket,
                as: "booking_detail_ticket",
                where: {
                    tourId: tour.tourId,
                },
                attributes: {
                    exclude: ["ticketTypeId", "updatedAt", "createdAt", "status"]
                }
            },
            attributes: [
                "bookingDetailId", "quantity",
            ],
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
            })
        } catch (error) {
            console.log(error)
        }

        resolve({
            status: 201,
            data: {
                msg: "Booking Tour Created. Please finish your payments",
                booking: booking,
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
        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            },
            include: {
                model: db.User,
                as: "booking_user",
                attributes: ["userId", "userName", "email"]
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

        const bookingDetail = await db.BookingDetail.findOne({
            where: {
                bookingId: booking.bookingId
            },
            attributes: ["bookingDetailId"],
            include: {
                model: db.Ticket,
                as: "booking_detail_ticket",
                attributes: ["ticketId"],
                include: {
                    model: db.Tour,
                    as: "ticket_tour",
                    attributes: ["tourId", "departureDate", "tourStatus"]
                }
            }
        })

        /**
         * Validate Booking Status
         */
        var bookingStatus = req.query.bookingStatus
        if (bookingStatus === undefined || bookingStatus === null) {
            bookingStatus = booking.bookingStatus
        } else {
            //Check if booking is already finished
            if (TOUR_STATUS.FINISHED === bookingDetail.booking_detail_ticket.ticket_tour.tourStatus) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Cannot update booking status because tour is finished`,
                    }
                })
                return
            }
            const currentDate = new Date()
            currentDate.setHours(currentDate.getHours() + 7)
            const departureDate = new Date(bookingDetail.booking_detail_ticket.ticket_tour.departureDate)

            //Need to update the time when the tour is finished
            if (BOOKING_STATUS.ON_GOING === bookingStatus) {
                if (currentDate > departureDate) {
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
                /**
                * Sending OTP if user not logged in
                */

                const otp = await db.Otp.findOne({
                    where: {
                        otpType: OTP_TYPE.CANCEL_BOOKING,
                        userId: booking.customerId
                    }
                })

                if (!otp) {
                    const data = await OtpService.sendOtpToEmail(booking.booking_user.email, booking.booking_user.userId, booking.booking_user.userName, OTP_TYPE.CANCEL_BOOKING)
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

                if (currentDate > departureDate) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update booking status ${bookingStatus} because tour started`,
                        }
                    })
                    return
                }
            }

            if (BOOKING_STATUS.FINISHED === bookingStatus) {
                if (currentDate < departureDate) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update booking status ${bookingStatus} because tour not started`,
                        }
                    })
                    return
                }
            }
        }

        var isAttended = req.query.isAttended
        if (isAttended === undefined || isAttended === null) {
            isAttended = booking.isAttended
        }

        var status = req.query.status
        if (status === undefined || status === null) {
            status = booking.status
        }

        await db.Booking.update({
            isAttended: isAttended,
            bookingStatus: bookingStatus,
            status: status,
        }, {
            where: {
                bookingId: booking.bookingId
            },
            individualHooks: true,
            transaction: t
        })

        await db.BookingDetail.update({
            status: status,
        }, {
            where: {
                bookingId: booking.bookingId
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
