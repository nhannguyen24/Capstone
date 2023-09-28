const db = require('../models');
const { Op } = require('sequelize');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")
const OTP_TYPE = require("../enums/OtpTypeEnum")
const mailer = require("../utils/MailerUtil")
const OtpService = require("./OtpService")
const qr = require('qrcode');

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
                    status: 404,
                    data: {
                        msg: `Customer not found with ID: ${customerId}`,
                    }
                });
                return
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
                msg: `No booking result`,
                bookings: []
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getBookingsForManager = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookings = await db.Booking.findAll({
            order: [
                ["bookingDate", "DESC"],
                ["updatedAt", "DESC"],
            ]
        });

        resolve({
            status: 200,
            data: bookings ? {
                msg: `Get Bookings successfully`,
                bookings: bookings
            } : {
                msg: `No booking result`,
                bookings: []
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getBookingsByEmail = (req) => new Promise(async (resolve, reject) => {
    try {
        let email = req.query.email
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
            OtpService.sendOtpToEmail(user.email, user.userId, user.userName, OTP_TYPE.GET_BOOKING_EMAIL)
            return
        }

        if (!otp.isAllow || !otp) {
            resolve({
                status: 403,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            });
            return
        }

        const bookings = await db.Booking.findAll({
            where: {
                customerId: user.userId
            },
            order: [
                ["bookingDate", "DESC"]
            ]
        });

        resolve({
            status: 200,
            data: bookings ? {
                msg: `Get bookings successfully`,
                bookings: bookings
            } : {
                msg: `No booking results`,
                bookings: []
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
        const resultUser = await db.User.findOrCreate({
            where: {
                email: user.email
            },
            defaults: { email: user.email, userName: user.userName, phone: user.phone, birthday: birthday, roleId: "58c10546-5d71-47a6-842e-84f5d2f72ec3" }
        })

        const otp = await db.Otp.findOne({
            where: {
                otpType: OTP_TYPE.BOOKING_TOUR,
                userId: resultUser[0].dataValues.userId
            }
        })

        console.log(otp)

        if (!otp) {
            OtpService.sendOtpToEmail(resultUser[0].dataValues.email, resultUser[0].dataValues.userId, resultUser[0].dataValues.userName, OTP_TYPE.BOOKING_TOUR)
        } else if (!otp.isAllow) {
            resolve({
                status: 403,
                data: {
                    msg: `Action not allow, Please validate OTP!`,
                }
            });
            return
        }
        if(otp.isAllow){
            await db.sequelize.transaction(async (transaction) => {
                const setUpBooking = { totalPrice: totalPrice, customerId: resultUser[0].dataValues.userId }
                const booking = await db.Booking.create(setUpBooking);
    
                for (const e of tickets) {
                    const ticket = await db.Ticket.findOne({
                        where: {
                            ticketId: e.ticketId,
                            tourId: e.tourId
                        }
                    })
                    if (!ticket) {
                        resolve({
                            status: 404,
                            data: {
                                msg: `Ticket not found with id ${e.ticketId}`,
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
                                msg: `Price not found with id ${e.priceId}`,
                            }
                        })
                        return
                    }
                    const bookingDetail = { TicketPrice: price.amount, bookingId: booking.bookingId, ticketId: ticket.ticketId }
                    const setUpTransaction = { amount: price.amount, bookingId: booking.bookingId }
                    await db.Transaction.create(setUpTransaction)
                    await db.BookingDetail.create(bookingDetail)
                }
            })
    
            const TourName = "Tour du lich"
            const TourDate = "01/10/2023"
            const TourDuration = "4 hours"
            const userEmail = resultUser[0].dataValues.email;
            const qrCodeDataURL = await qr.toDataURL(userEmail);
    
            const htmlContent = {
                body: {
                    name: resultUser[0].dataValues.userName,
                    intro: `Thank you for choosing <b>NBTour</b> for your adventure! We look forward to sharing this incredible experience with you.`,
                    action: {
                        instructions: 'Here is your <b>tickets QR code</b> for the upcoming tour:',
                        table: {
                            headers: ['Tour Details'],
                            rows: [
                                ['Tour Name:', `${TourName}`],
                                ['Tour Date:', `${TourDate}`],
                                ['Tour Duration:', `${TourDuration}`],
                                ['Total Amount Paid:', `${totalPrice}`],
                                ['User QR Code:', `<img src="${qrCodeDataURL}" alt="User QR Code" />`],
                            ]
                        }
                    },
                    outro: `If you have any questions or need assistance, please don't hesitate to reach out to our customer support team at [Customer Support Email] or [Customer Support Phone Number].`,
                    signature: 'Sincerely'
                }
            };
            mailer.sendMail(resultUser[0].dataValues.email, "Tour booking tickets", htmlContent)
        }

        await t.commit()
        resolve({
            status: 201,
            data: {
                msg: "Create booking successfully",
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
        const bookingId = req.params.bookingId

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


module.exports = { getBookingDetailByBookingId, getBookingsForCustomer, getBookingsForManager, getBookingsByEmail, createBooking, updateBooking, deleteBooking };