const { StatusCodes } = require('http-status-codes');
const db = require('../models');
const STATUS = require('../enums/StatusEnum')
const TRANSACTION_TYPE = require('../enums/TransactionTypeEnum')
const { Op } = require('sequelize');

const getTransactions = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const bookingId = req.query.bookingId || ""
        const transactionCode = req.query.transactionCode || ""
        const transactionType = req.query.transactionType || ""
        const status = req.query.status || ""

        let whereClause = {}

        if (transactionCode.trim() !== "") {
            whereClause.transactionCode = transactionCode
        }

        if (transactionType.trim() !== "") {
            whereClause.transactionType = transactionType
        }

        if (bookingId.trim() !== "") {
            whereClause.bookingId = bookingId
        }

        if (status !== "") {
            whereClause.status = status
        }

        const transactions = await db.Transaction.findAll({
            where: whereClause,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "transaction_booking",
                    attributes: { exclude: ["createdAt", "updatedAt"] }
                }
            ],
            limit: limit,
            offset: offset
        });

        const totalTrans = await db.Transaction.count({
            where: whereClause,
        });

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get transactions successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalTrans
                },
                transactions: transactions
            }
        }

    } catch (error) {
        console.error(error);
    }
}
const getTourTransactionOfflineForPaidBackToManager = async (scheduleId) => {
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
                    msg: "Tour schedule not found!"
                }
            }
        }

        const bookings = await db.Booking.findAll({
            where: {
                scheduleId: scheduleId
            },
            include: [
                {
                    model: db.Transaction,
                    as: "booking_transaction",
                    where: {
                        transactionType: TRANSACTION_TYPE.MOMO,
                        status: STATUS.PAID
                    },
                },
                {
                    model: db.Schedule,
                    as: "booking_schedule",
                    include: {
                        model: db.User,
                        as: "schedule_tourguide",
                        attributes: ["userName", "phone"]
                    }
                }
            ]
        })

        let isPaidToManager = false
        let totalAmount = 0
        const schedule = bookings[0].booking_schedule
        bookings.map((booking) => {
            if (booking.booking_transaction.isPaidToManager === true) {
                isPaidToManager = true
            }

            totalAmount += booking.totalPrice
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get transactions for paid back successfully`,
                paidBackInfo: {
                    totalAmount: totalAmount,
                    isPaidToManager: isPaidToManager,
                    schedule: schedule
                },
                // transactions: bookings
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "Something went wrong while fetching transactions!"
            }
        }
    }
}

const paidBackToManager = async (tourId) => {
    try {
        // const tour = await db.Tour.findOne({
        //     where: {
        //         tourId: tourId
        //     }
        // })
        // if (!tour) {
        //     return {
        //         status: StatusCodes.NOT_FOUND,
        //         data: {
        //             msg: "Tour not found!"
        //         }
        //     }
        // }

        // const tourData = await db.Tour.findOne({
        //     where: {
        //         tourId: tourId
        //     },
        //     include: {
        //         model: db.Ticket,
        //         as: "tour_ticket",
        //         include: {
        //             model: db.BookingDetail,
        //             as: "ticket_booking_detail",
        //             group: "bookingId",
        //             include: {
        //                 model: db.Booking,
        //                 as: "detail_booking",
        //                 include: {
        //                     model: db.Transaction,
        //                     as: "booking_transaction",
        //                     where: {
        //                         transactionType: TRANSACTION_TYPE.CASH,
        //                         isPaidToManager: false,
        //                         status: STATUS.PAID
        //                     },
        //                 }
        //             }
        //         }
        //     },
        // })

        // const uniqueTransactions = new Set();
        // const filteredBookingTransactions = tourData.tour_ticket
        //     .flatMap((ticket) =>
        //         ticket.ticket_booking_detail
        //             .filter((bookingDetail) =>
        //                 bookingDetail.detail_booking && bookingDetail.detail_booking.booking_transaction
        //             )
        //             .map((bookingDetail) => bookingDetail.detail_booking.booking_transaction)
        //     )
        //     .filter((transaction) => {
        //         if (transaction && transaction.transactionId) {
        //             if (!uniqueTransactions.has(transaction.transactionId)) {
        //                 uniqueTransactions.add(transaction.transactionId);
        //                 return true
        //             }
        //         }
        //         return false
        //     })

        // if (filteredBookingTransactions.length === 0) {
        //     return {
        //         status: StatusCodes.NOT_FOUND,
        //         data: {
        //             msg: "Tour got no offline bookings or already paid back to manager!"
        //         }
        //     }
        // }

        // filteredBookingTransactions.map((transaction) => {
        //     db.Transaction.update({ isPaidToManager: true }, {
        //         where: {
        //             transactionId: transaction.transactionId
        //         }
        //     })
        // })

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Update paid back to manager successfully!`,
                isPaidToManager: true
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "Something went wrong while update paid back to manager!"
            }
        }
    }
}

const getTransactionById = async (transactionId) => {
    try {
        const transaction = await db.Transaction.findOne({
            where: {
                transactionId: transactionId
            },
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "transaction_booking",
                }
            ],
            attributes: {
                exclude: ["bookingId"]
            }
        });

        return {
            status: transaction ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: transaction ? {
                msg: `Get list of transactions successfully`,
                transaction: transaction
            } : {
                msg: `Transaction not found!`,
                transaction: {}
            }
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = { getTransactions, getTransactionById, getTourTransactionOfflineForPaidBackToManager, paidBackToManager };