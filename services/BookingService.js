const db = require('../models');
const { Op } = require('sequelize');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")

const getBookingDetailByBookingId = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.bookingId
        if (bookingId === undefined || bookingId === null || bookingId.trim().length < 1) {
            resolve({
                status: 400,
                data: {
                    msg: `bookingId required`,
                    booking: {}
                }
            });
        }

        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            }
        })

        if (!booking) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking not found with ID ${bookingId}`,
                    booking: {}
                }
            });
        }

        const bookingDetails = await db.BookingDetail.findAll({
            where: {
                bookingId: booking.bookingId
            },
        });

        resolve({
            status: bookingDetails ? 200 : 400,
            data: {
                msg: bookingDetails ? 'Get Booking detail successfully' : 'Booking detail not found',
                bookingDetails: bookingDetails || [],
            },
        });
    } catch (error) {
        reject(error);
    }
});

const getBookingsForCustomer = (req) => new Promise(async (resolve, reject) => {
    try {
        let customerId = req.query.customerId
        if (customerId === undefined || customerId === null || customerId.trim().length < 1) {
            customerId = ""
        } else {
            const user = await db.User.findOne({
                where: {
                    userId: customerId
                }
            })

            if (!user) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Customer not found with ID ${customerId}`,
                    }
                });
            }
        }
        let bookingCode = req.query.bookingCode
        if (bookingCode === undefined || bookingCode === null) {
            bookingCode = ""
        }

        const bookings = await db.Booking.findAll({
            where: {
                bookingCode: {
                    [Op.substring]: bookingCode
                },
                customerId: customerId
            },
            order: [
                ["bookingDate", "DESC"]
            ]
        });

        resolve({
            status: 200,
            data: bookings ? {
                msg: `Get Bookings successfully`,
                bookings: bookings
            } : {
                msg: `Bookings not found`,
                bookings: []
            }
        });

    } catch (error) {
        console.log(error)
        reject(error);
    }
});


const createBooking = (req) => new Promise(async (resolve, reject) => {
    const t = await sequelize.transaction();
    try {
        const user = req.body.user
        const tickets = req.body.tickets
        const totalPrice = req.body.totalPrice
        const resultUser = await db.User.findOrCreate({
            where: {
                email: user.email
            },
            defaults: { email: user.email, fullName: user.fullName, phone: user.phone, birthday: user.birthday }
        })

        const booking = await db.Booking.create({
            defaults: { totalPrice: totalPrice, customerId: resultUser.userId }
        });

        for (const e of tickets) {
            const ticket = await db.Ticket.findOne({
                where: {
                    ticketId: e.ticketId,
                    tourId: e.tourId
                }
            })
            if (!ticket) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Ticket not found with id ${e.ticketId}`,
                    }
                })
            }
            const price = await db.Price.findOne({
                where: {
                    priceId: e.priceId,
                }
            })
            if (!price) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Price not found with id ${e.priceId}`,
                    }
                })
            }
            const bookingDetail = {TicketPrice: price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId}

            await db.BookingDetail.create(bookingDetail)
        }

        await t.commit();

        resolve({
            status: 201,
            data: {
                msg: "Create booking successfully",
            }
        })

    } catch (error) {
        reject(error);
    }
});

const updateBooking = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const bookingId = req.params.bookingId

        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            }
        })

        if (!booking) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking not found with id ${bookingId}`,
                }
            })
        }

        var bookingStatus = req.query.bookingStatus
        if (bookingStatus === undefined || bookingStatus === null) {
            bookingStatus = booking.bookingStatus
        }
        //Check booking Status

        var status = req.query.status
        if (status === undefined || status === null) {
            status = booking.status
        }

        await db.Booking.update({
            bookingStatus: bookingStatus,
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
        reject(error);
    }
});

const deleteBooking = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.bookingId

        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            }
        })

        if (!booking) {
            resolve({
                status: 400,
                data: {
                    msg: `Booking not found with id ${bookingId}`,
                }
            })
        }

        await db.Booking.update({
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


module.exports = { getBookingDetailByBookingId, getBookingsForCustomer, createBooking, updateBooking, deleteBooking };