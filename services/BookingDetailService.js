const db = require('../models');
const { Op } = require('sequelize');
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const STATUS = require("../enums/StatusEnum")

const getAllBookings = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookings = await db.Booking.findAll();

        resolve({
            status: 200,
            data: bookings ? {
                msg: `Get the list of the bookings successfully`,
                bookings: bookings
            } : {
                msg: `Bookings not found`,
                bookings: []
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getBookingById = (req) => new Promise(async (resolve, reject) => {
    try {
        const bookingId = req.params.bookingId
        
        const booking = await db.Booking.findOne({
            where: {
                bookingId: bookingId
            },
        });

        resolve({
            status: 200,
            data: booking ? {
                msg: `Get Booking successfully`,
                booking: booking
            } : {
                msg: `Booking not found`,
                booking: []
            }
        });

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
            }, transaction: t
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
            }
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


module.exports = { getAllBookings, getBookingById, updateBooking, deleteBooking };