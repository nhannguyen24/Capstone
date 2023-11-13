const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum");
const BOOKING_STATUS = require("../enums/BookingStatusEnum");
const TOUR_STATUS = require("../enums/TourStatusEnum");
const { StatusCodes } = require('http-status-codes');

const getStatistics = async (req) => {
    try {
        const startDate = req.query.startDate || ""
        const endDate = req.query.endDate || ""
        const bookingStatus = req.query.bookingStatus
        const routeId = req.query.routeId || ""

        var whereClause = {}
        var whereClauseRoute = {}
        var whereClauseTour = {}
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        if (bookingStatus !== null && bookingStatus !== undefined) {
            const bookingStatusArray = bookingStatus.split(',')
            whereClause.bookingStatus = {
                [Op.in]: bookingStatusArray
            }
        }

        if (routeId !== "") {
            whereClauseRoute.routeId = routeId
        }

        if (startDate !== "" && endDate !== "") {
            const _startDate = new Date(startDate)
            const _endDate = new Date(endDate)
            if (_startDate > _endDate) {
                whereClause.bookingDate = {
                    [Op.between]: [endDate + "T00:00:00.000Z", startDate + "T23:59:59.000Z"]
                }
                whereClauseTour.createdAt = {
                    [Op.between]: [endDate + "T00:00:00.000Z", startDate + "T23:59:59.000Z"]
                }
                whereClauseRoute.createdAt = {
                    [Op.between]: [endDate + "T00:00:00.000Z", startDate + "T23:59:59.000Z"]
                }
            } else {
                whereClause.bookingDate = {
                    [Op.between]: [startDate + "T00:00:00.000Z", endDate + "T23:59:59.000Z"]
                }
                whereClauseTour.createdAt = {
                    [Op.between]: [startDate + "T00:00:00.000Z", endDate + "T23:59:59.000Z"]
                }
                whereClauseRoute.createdAt = {
                    [Op.between]: [startDate + "T00:00:00.000Z", endDate + "T23:59:59.000Z"]
                }
            }
        } else {
            if (startDate !== "") {
                whereClause.bookingDate = {
                    [Op.gte]: startDate + "T00:00:00.000Z"
                }
                whereClauseTour.createdAt = {
                    [Op.gte]: startDate + "T00:00:00.000Z"
                }
                whereClauseRoute.createdAt = {
                    [Op.gte]: startDate + "T00:00:00.000Z"
                }
            }
            if (endDate !== "") {
                whereClause.bookingDate = {
                    [Op.lte]: endDate + "T23:59:59.000Z"
                }
                whereClauseTour.createdAt = {
                    [Op.lte]: endDate + "T23:59:59.000Z"
                }
                whereClauseRoute.createdAt = {
                    [Op.lte]: endDate + "T23:59:59.000Z"
                }
            }
        }

        const bookingDetails = await db.BookingDetail.findOne({
            include: [
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: whereClause,
                    include: {
                        model: db.Transaction,
                        as: "booking_transaction",
                        attributes: {
                            exclude: ["bookingId"]
                        }
                    }
                }
            ],
            attributes: {
                exclude: ["bookingId"]
            }
        })
        if (routeId !== "") {
            const route = await db.Route.findOne({
                where: {
                    routeId: routeId
                }
            })

            if(!route){
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: "Route not found!"
                    }
                }
            }

            const tours = await db.Tour.findAll({
                raw: true,
                nest: true,
                where: whereClauseRoute,
                include: {
                    model: db.Ticket,
                    as: "tour_ticket",
                    include: {
                        model: db.BookingDetail,
                        as: "ticket_booking_detail",
                        include: {
                            model: db.Booking,
                            as: "detail_booking",
                            include: {
                                model: db.Transaction,
                                as: "booking_transaction"
                            }
                        }
                    }
                }
            })
            var totalBookedTickets = 0
            var totalCancelTickets = 0
            var totalMoneyEarned = 0
            var totalCreatedTours = 0
            var totalCancelTours = 0
            if (tours.length > 1) {
                const duplicateBookingId = new Set();
                const duplicateTourId = new Set();
                tours.map((tour) => {
                    if (tour.tour_ticket.ticket_booking_detail.bookingDetailId !== null) {
                        if (duplicateBookingId.has(tour.tour_ticket.ticket_booking_detail.bookingId)) {
                            if (BOOKING_STATUS.CANCELED === tour.tour_ticket.ticket_booking_detail.detail_booking.bookingStatus) {
                                totalCancelTickets += tour.tour_ticket.ticket_booking_detail.quantity
                            } else {
                                totalBookedTickets += tour.tour_ticket.ticket_booking_detail.quantity
                            }

                            if (STATUS.REFUNDED === tour.tour_ticket.ticket_booking_detail.detail_booking.booking_transaction.status) {
                                if (tour.tour_ticket.ticket_booking_detail.detail_booking.booking_transaction.refundAmount !== 0) {
                                    totalMoneyEarned += (tour.tour_ticket.ticket_booking_detail.detail_booking.booking_transaction.amount - tour.tour_ticket.ticket_booking_detail.detail_booking.booking_transaction.refundAmount)
                                } else {
                                    totalMoneyEarned += tour.tour_ticket.ticket_booking_detail.detail_booking.booking_transaction.amount
                                }
                            } else {
                                totalMoneyEarned += tour.tour_ticket.ticket_booking_detail.detail_booking.totalPrice
                            }
                        } else {
                            duplicateBookingId.add(tour.tour_ticket.ticket_booking_detail.bookingId)
                        }
                    }
                    if (duplicateTourId.has(tour.tourId)) {
                        if (TOUR_STATUS.CANCELED === tour.tourStatus) {
                            totalCancelTours++
                        }
                        totalCreatedTours++
                    } else {
                        duplicateTourId.add(tour.tourId)
                    }
                })
            }
            return {
                status: StatusCodes.OK,
                data: {
                    msg: `Get statistic successfully`,
                    totalBookedTickets: totalBookedTickets,
                    totalCancelTickets: totalCancelTickets,
                    totalMoneyEarned: totalMoneyEarned,
                    totalCreatedTour: totalCreatedTours,
                    totalCancelTour: totalCancelTours,
                }
            }
        }

        var totalCreatedTours = 0
        var totalCancelTours = 0
        const tours = await db.Tour.findAll({
            where: whereClauseTour,
        })

        tours.map((tour) => {
            if (TOUR_STATUS.CANCELED === tour.tourStatus) {
                totalCancelTours++
            }
            totalCreatedTours++
        })

        var totalBookedTickets = 0
        var totalCancelTickets = 0
        var totalMoneyEarned = 0
        bookingDetails.map((bookingDetail) => {
            if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
                totalCancelTickets += bookingDetail.quantity
            } else {
                totalBookedTickets += bookingDetail.quantity
            }

            if (STATUS.REFUNDED === bookingDetail.detail_booking.booking_transaction.status) {
                if (bookingDetail.detail_booking.booking_transaction.refundAmount !== 0) {
                    totalMoneyEarned += (bookingDetail.detail_booking.booking_transaction.amount - bookingDetail.detail_booking.booking_transaction.refundAmount)
                } else {
                    totalMoneyEarned += bookingDetail.detail_booking.booking_transaction.amount
                }
            } else {
                totalMoneyEarned += bookingDetail.detail_booking.totalPrice
            }
        })

        return {
            status: bookingDetails.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: bookingDetails.length > 0 ? {
                msg: `Get statistic successfully`,
                totalBookedTickets: totalBookedTickets,
                totalCancelTickets: totalCancelTickets,
                totalMoneyEarned: totalMoneyEarned,
                totalCreatedTour: totalCreatedTours,
                totalCancelTour: totalCancelTours,
            } : {
                msg: `Could not find any statistics based on your request.`,
                totalBookedTickets: totalBookedTickets,
                totalCancelTickets: totalCancelTickets,
                totalMoneyEarned: totalMoneyEarned,
                totalCreatedTour: totalCreatedTours,
                totalCancelTour: totalCancelTours,
            }
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { getStatistics };