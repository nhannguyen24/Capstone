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
        let email = req.params.email
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

        if("58c10546-5d71-47a6-842e-84f5d2f72ec3" !== resultUser[0].dataValues.roleId){
            resolve({
                status: 403,
                data: {
                    msg: `Role not allow for this action`,
                }
            });
            return
        }

        const tour = await db.Tour.findOne({
            where: {
                tourId: tickets[0].tourId, 
            },
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
            if(TOUR_STATUS.NOT_STARTED !== tour.tourStatus || STATUS.DEACTIVE === tour.status){
                resolve({
                    status: 403,
                    data: {
                        msg: `Tour already started, finished or deactive `,
                    }
                });
                return
            }
        }
        
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
        const schedule = await db.Schedule.findOne({
            where: {
                tourId: tickets[0].tourId
            },
            include: {
                model: db.Bus,
                as: "schedule_bus",
                attributes: ["busId", "numberSeat"]
            },
            attributes: ["scheduleId", "busId", "tourId"]
        })

        let totalBookedSeat = 0
        const bookingDetails = await db.BookingDetail.findAll({
            include: {
                model: db.Ticket,
                as: "booking_detail_ticket",
                where: {
                    tourId: schedule.tourId
                },
                attributes: {
                    exclude: ["ticketTypeId", "updatedAt", "createdAt", "status"]
                }
            },
            attributes: [
                "bookingDetailId", "quantity",
            ],
        })

        for (const e of bookingDetails) {
            totalBookedSeat += e.quantity
        }

        if (seatBookingQuantity + totalBookedSeat > schedule.schedule_bus.numberSeat) {
            const availableSeats = schedule.schedule_bus.numberSeat - totalBookedSeat;
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
                const setUpBooking = { totalPrice: totalPrice, customerId: resultUser[0].dataValues.userId }
                booking = await db.Booking.create({ setUpBooking }, { transaction: t });
    
                await db.Transaction.create({ amount: totalPrice, bookingId: booking.bookingId }, { transaction: t })

                for (let index = 0; index < ticketList.length; index++) {
                    const e = ticketList[index];
                    await db.BookingDetail.create({ TicketPrice: e.dataValues.ticket_price.amount, bookingId: booking.bookingId, ticketId: e.dataValues.ticketId, quantity: tickets[index].quantity }, { transaction: t });
                }
            })
        } catch (error) {
            console.log(error)
        }
        
        /**
         * Starting Send QR To Customer through Email
         */
        const tourName = tour.tourName
        const tourDepartureDate = new Date(tour.departureDate)
        const formatDepartureDate = `${tourDepartureDate.getDate().toString().padStart(2, '0')}/${(tourDepartureDate.getMonth() + 1).toString().padStart(2, '0')}/${tourDepartureDate.getFullYear()}  |  ${tourDepartureDate.getHours().toString().padStart(2, '0')}:${tourDepartureDate.getMinutes().toString().padStart(2, '0')}`
        const tourDuration = tour.duration
        const getBookedTickets = await db.BookingDetail.findAll({
            where: {
                bookingId: booking.bookingId
            },
            include:
            {
                model: db.Ticket,
                as: "booking_detail_ticket",
                include: [
                    {
                        model: db.TicketType,
                        as: "ticket_type",
                        attributes: ["ticketTypeName", "description"]
                    },
                    {
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: ["tourName", "departureDate", "duration", "status"]
                    },
                ],
                attributes: {
                    exclude: ["tourid", "ticketTypeId", "updatedAt", "createdAt"]
                }
            },
            attributes: {
                exclude: ["ticketId", "updatedAt", "createdAt"]
            }
        })

        const bookedTickets = JSON.stringify(getBookedTickets)

        qr.toFile(`./qrcode/${booking.bookingId}.png`, bookedTickets, function (err) {
            if (err) { console.log(err) }
        })

        const htmlContent = {
            body: {
                name: resultUser[0].dataValues.userName,
                intro: [`Thank you for choosing <b>NBTour</b> booking system. Here is your <b>QR code<b> attachment for upcomming tour tickets`,
                    `<b>Tour Information:</b>`, `  - Tour Name: <b>${tourName}</b>`, `  - Tour Departure Date: <b>${formatDepartureDate}</b>`,
                    `  - Tour Duration: <b>${tourDuration}</b>`, `  - Tour Total Price: <b>${totalPrice}</b>`],
                outro: [`If you have any questions or need assistance, please to reach out to our customer support team at [nbtour@gmail.com].`],
                signature: 'Sincerely'
            }
        };
        mailer.sendMail(resultUser[0].dataValues.email, "Tour booking tickets", htmlContent, booking.bookingId)

        resolve({
            status: 201,
            data: {
                msg: "Booking Tour Successfully. Check your Email for tikets QR code",
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
