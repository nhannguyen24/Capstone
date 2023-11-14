const db = require('../models')
const { Op } = require('sequelize')
const STATUS = require("../enums/StatusEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const { StatusCodes } = require('http-status-codes')

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

        const duplicateBookingId = new Set()
        const duplicateTourId = new Set()
        var totalCreatedTours = 0
        var totalCancelTours = 0
        var totalAvailableTours = 0
        var totalStartedTours = 0
        var totalFinishedTours = 0
        var totalBookedTickets = 0
        var totalCancelTickets = 0
        var totalMoneyEarned = 0
        var totalBusSeat = 0
        if (routeId !== "") {
            const route = await db.Route.findOne({
                where: {
                    routeId: routeId
                }
            })

            if (!route) {
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
                include: [
                    {
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
                },
                {
                    model: db.Bus,
                    as: "tour_bus",
                    attributes: ["busId", "numberSeat"]
                }
            ]
            })

            if (tours.length > 1) {
                tours.map((tour) => {
                    //Getting record that have booking
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
                        }
                        duplicateBookingId.add(tour.tour_ticket.ticket_booking_detail.bookingId)
                    }
                    if (duplicateTourId.has(tour.tourId)) {
                        if (TOUR_STATUS.CANCELED === tour.tourStatus) {
                            totalCancelTours++
                        }
                        totalCreatedTours++
                    } else {
                        totalBusSeat += tour.tour_bus.numberSeat
                        duplicateTourId.add(tour.tourId)
                    }
                })
            }
            const booking_statistic = {
                totalBookedTickets: totalBookedTickets,
                totalCancelTickets: totalCancelTickets,
                totalMoneyEarned: totalMoneyEarned,
                totalBusSeat: totalBusSeat
            }

            const tour_statistic = {
                totalCreatedTour: totalCreatedTours,
                totalCancelTour: totalCancelTours,
                totalAvailableTours: totalAvailableTours,
                totalStartedTours: totalStartedTours,
                totalFinishedTours: totalFinishedTours
            }

                return {
                    status: tours.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
                    data: tours.length > 0 ? {
                        msg: `Get statistic successfully`,
                        booking_statistic: booking_statistic,
                        tour_statistic: tour_statistic,
                    } : {
                        msg: `Could not find any statistics based on your request.`,
                        booking_statistic: booking_statistic,
                        tour_statistic: tour_statistic
                    }
                }
        }

        const bookingDetails = await db.BookingDetail.findAll({
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
                },
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    include: {
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: ["tourId", "busId"],
                        include: {
                            model: db.Bus,
                            as: "tour_bus",
                            attributes: ["busId", "numberSeat"]
                        }
                    }
                }
            ],
            attributes: {
                exclude: ["bookingId"]
            }
        })

        const tours = await db.Tour.findAll({
            where: whereClauseTour,
        })

        tours.map((tour) => {
            if (TOUR_STATUS.CANCELED === tour.tourStatus) {
                totalCancelTours++
            }
            if (TOUR_STATUS.STARTED === tour.tourStatus) {
                totalStartedTours++
            }
            if (TOUR_STATUS.AVAILABLE === tour.tourStatus) {
                totalAvailableTours++
            }
            if (TOUR_STATUS.FINISHED === tour.tourStatus) {
                totalFinishedTours++
            }
            totalCreatedTours++
        })

        bookingDetails.map((bookingDetail) => {
            if (BOOKING_STATUS.CANCELED === bookingDetail.detail_booking.bookingStatus) {
                totalCancelTickets += bookingDetail.quantity
            } else {
                totalBookedTickets += bookingDetail.quantity
            }

            const tourId = bookingDetail.booking_detail_ticket.ticket_tour.tourId
            if (!duplicateTourId.has(tourId)) {
                duplicateTourId.add(tourId)
                totalBusSeat += bookingDetail.booking_detail_ticket.ticket_tour.tour_bus.numberSeat
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

        const booking_statistic = {
            totalBookedTickets: totalBookedTickets,
            totalCancelTickets: totalCancelTickets,
            totalMoneyEarned: totalMoneyEarned,
            totalBusSeat: totalBusSeat
        }

        const tour_statistic = {
            totalCreatedTour: totalCreatedTours,
            totalCancelTour: totalCancelTours,
            totalAvailableTours: totalAvailableTours,
            totalStartedTours: totalStartedTours,
            totalFinishedTours: totalFinishedTours
        }

        return {
            status: bookingDetails.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: bookingDetails.length > 0 ? {
                msg: `Get statistic successfully`,
                booking_statistic: booking_statistic,
                tour_statistic: tour_statistic,
                test: bookingDetails
            } : {
                msg: `Could not find any statistics based on your request.`,
                booking_statistic: booking_statistic,
                tour_statistic: tour_statistic
            }
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = { getStatistics }