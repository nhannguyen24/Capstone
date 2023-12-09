const db = require('../models')
const { Op } = require('sequelize')
const STATUS = require("../enums/StatusEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const PERIODICITY = require('../enums/PeriodicityEnum');
const { StatusCodes } = require('http-status-codes')
const millisecondsInOneDay = 24 * 60 * 60 * 1000
const getStatistics = async (req) => {
    try {
        const startDate = req.query.startDate || ""
        const endDate = req.query.endDate || ""
        const periodicity = req.query.periodicity
        const routeId = req.query.routeId || ""

        var whereClause = {}
        if (routeId.trim() !== "") {
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
            whereClause.routeId = routeId
        }

        let periodicityDateArr = []
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        if (periodicity !== null && periodicity !== undefined) {
            if (PERIODICITY.WEEKLY === periodicity.toUpperCase()) {
                const noTimeCurrentDateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${(currentDate.getDate() - 1).toString().padStart(2, '0')}T00:00:00.000Z`

                const noTimeCurrentDate = new Date(noTimeCurrentDateString)

                periodicityDateArr = getStartAndEndDatesForLast7Weeks(noTimeCurrentDate)
            } else if (PERIODICITY.MONTHLY === periodicity.toUpperCase()) {
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
                const year = currentDate.getFullYear()

                periodicityDateArr = getStartAndEndDatesForLast7Months(year, month)
            }
        } else {
            if (startDate !== "" && endDate !== "") {
                const _startDate = new Date(startDate)
                const _endDate = new Date(endDate)
                if (_startDate > _endDate) {
                    periodicityDateArr.push({ startDate: endDate + "T00:00:00.000Z", endDate: startDate + "T23:59:59.000Z" })
                } else {
                    periodicityDateArr.push({ startDate: startDate + "T00:00:00.000Z", endDate: endDate + "T23:59:59.000Z" })
                }
            } else {
                if (startDate !== "") {
                    periodicityDateArr.push({ startDate: startDate + "T00:00:00.000Z", endDate: "" })
                }
                if (endDate !== "") {
                    periodicityDateArr.push({ startDate: "", endDate: endDate + "T23:59:59.000Z" })
                }
            }
        }

        var totalCreatedTours = 0
        var totalCancelTours = 0
        var totalAvailableTours = 0
        var totalFinishedTours = 0

        var totalBookedTickets = 0
        var totalCancelTickets = 0
        var totalMoneyEarned = 0
        var totalBusSeat = 0

        const tourList = []

        const tourPromises = periodicityDateArr.map(async (date) => {
            if (date.startDate !== "" && date.endDate !== "") {
                whereClause.createdAt = {
                    [Op.between]: [date.startDate, date.endDate]
                }
            } else {
                if (date.startDate !== "" && date.endDate === "") {
                    whereClause.createdAt = {
                        [Op.gte]: date.startDate
                    }
                }
                if (date.endDate !== "" && date.startDate === "") {
                    whereClause.createdAt = {
                        [Op.lte]: date.endDate
                    }
                }
            }

            const tours = await db.Tour.findAll({
                raw: true,
                nest: true,
                where: whereClause,
                attributes: {
                    exclude: ["createdAt", "updatedAt", "busId", "status", "beginBookingDate", "endBookingDate", "tourGuideId", "driverId", "isScheduled"]
                },
                include: [
                    {
                        model: db.Ticket,
                        as: "tour_ticket",
                        attributes: ["ticketId", "status"],
                        include: {
                            model: db.TicketType,
                            as: "ticket_type",
                            attributes: ["ticketTypeName", "description"]
                        }
                    },
                    {
                        model: db.Bus,
                        as: "tour_bus",
                        attributes: ["numberSeat"]
                    }
                ]
            })
            const toursMap = {}
            if (tours.length > 0) {
                const bookingPromises = tours.map(async (tour) => {
                    var bookedTicketsQuantity = 0
                    var cancelTicketsQuantity = 0
                    var totalTicketsMoneyEarned = 0
                    const { tourId, tour_ticket, ...rest } = tour
                    const bookings = await db.Booking.findAll({
                        raw: true,
                        nest: true,
                        attributes: ["bookingId", "bookingDate", "totalPrice", "bookingStatus"],
                        include: [
                            {
                                model: db.BookingDetail,
                                as: "booking_detail",
                                where: {
                                    ticketId: tour_ticket.ticketId
                                },
                                attributes: {
                                    exclude: ["createdAt", "updatedAt", "bookingId", "ticketId", "ticketPrice"]
                                },
                            },
                            {
                                model: db.Transaction,
                                as: "booking_transaction",
                                attributes: {
                                    exclude: ["createdAt", "updatedAt", "bookingId", "transactionCode"]
                                }
                            }
                        ]
                    })

                    bookings.map((booking) => {
                        if (BOOKING_STATUS.CANCELED === booking.bookingStatus) {
                            totalCancelTickets += booking.booking_detail.quantity
                            cancelTicketsQuantity += booking.booking_detail.quantity
                        } else {
                            totalBookedTickets += booking.booking_detail.quantity
                            bookedTicketsQuantity += booking.booking_detail.quantity
                        }

                        if (STATUS.REFUNDED === booking.booking_transaction.status) {
                            if (booking.booking_transaction.refundAmount !== 0) {
                                totalMoneyEarned += (booking.booking_transaction.amount - booking.booking_transaction.refundAmount)
                                totalTicketsMoneyEarned += (booking.booking_transaction.amount - booking.booking_transaction.refundAmount)
                            } else {
                                totalMoneyEarned += booking.booking_transaction.amount
                                totalTicketsMoneyEarned += booking.booking_transaction.amount
                            }
                        } else {
                            totalMoneyEarned += booking.booking_transaction.amount
                            totalTicketsMoneyEarned += booking.booking_transaction.amount
                        }
                    })

                    tour_ticket.ticket_statistic = { bookedTicketsQuantity: bookedTicketsQuantity, cancelTicketsQuantity: cancelTicketsQuantity, totalTicketsMoneyEarned: totalTicketsMoneyEarned }
                    if (!toursMap[tourId]) {
                        toursMap[tourId] = { tourId: tourId, ...rest, tour_ticket: [tour_ticket] }
                    } else {
                        toursMap[tourId].tour_ticket.push(tour_ticket)
                    }
                })
                await Promise.all(bookingPromises)
            }
            const combinedTours = Object.values(toursMap)
            combinedTours.map((tour) => {
                if (tour.tour_bus.numberSeat !== null) {
                    totalBusSeat += tour.tour_bus.numberSeat
                }
                if (TOUR_STATUS.CANCELED === tour.tourStatus) {
                    totalCancelTours++
                }
                if (TOUR_STATUS.AVAILABLE === tour.tourStatus) {
                    totalAvailableTours++
                }
                if (TOUR_STATUS.FINISHED === tour.tourStatus) {
                    totalFinishedTours++
                }
                totalCreatedTours++
            })
            tourList.push({ date: date, tours: combinedTours })
        })
        await Promise.all(tourPromises)

        tourList.sort((a, b) => new Date(a.date.startDate) - new Date(b.date.startDate))

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
            totalFinishedTours: totalFinishedTours
        }

        return {
            status: tourList.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: tourList.length > 0 ? {
                msg: `Get statistic successfully`,
                booking_statistic: booking_statistic,
                tour_statistic: tour_statistic,
                result: tourList
            } : {
                msg: `Could not find any statistics based on your request!`,
                booking_statistic: booking_statistic,
                tour_statistic: tour_statistic,
                result: []
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

function getStartAndEndDatesForLast7Weeks(currentDate) {
    const currentDayOfWeek = currentDate.getDay()

    const daysSinceLastMonday = (currentDayOfWeek + 6) % 7

    const lastMonday = new Date(currentDate.getTime() - (daysSinceLastMonday * millisecondsInOneDay))

    const weeks = []
    for (let i = 0; i < 7; i++) {
        const startDate = new Date(lastMonday)
        startDate.setTime(startDate.getTime() - ((millisecondsInOneDay * 7) * i))

        const endDate = new Date(startDate)
        endDate.setTime(endDate.getTime() + ((millisecondsInOneDay * 7) - 1))

        weeks.push({ startDate: startDate, endDate: endDate })
    }
    return weeks
}

function getStartAndEndDatesForLast7Months(year, month) {
    let _year = year
    let _month = month

    const months = []
    for (let i = 1; i <= 7; i++) {
        if (_month === 0) {
            _month = 12
            _year--
        }
        const firstDayOfMonth = new Date(_year, _month - 1, 1)
        firstDayOfMonth.setHours(firstDayOfMonth.getHours() + 7)

        const lastDayOfMonth = new Date(_year, _month, 0)
        lastDayOfMonth.setHours(lastDayOfMonth.getHours() + 7)
        lastDayOfMonth.setTime(lastDayOfMonth.getTime() + millisecondsInOneDay - 1)

        months.push({ startDate: firstDayOfMonth, endDate: lastDayOfMonth })
        _month--
    }
    return months
}

module.exports = { getStatistics }