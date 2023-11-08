const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum");
const { StatusCodes } = require('http-status-codes');
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const getTickets = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const tourId = req.query.tourId || ""
        const ticketTypeId = req.query.ticketTypeId || ""

        let whereClause = {}

        if (tourId !== "") {
            whereClause.tourId = tourId
        }

        if (ticketTypeId !== "") {
            whereClause.ticketTypeId = ticketTypeId
        }

        const tickets = await db.Ticket.findAll({
            where: whereClause,
            include: [
                {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeId", "ticketTypeName", "description"]
                },
                {
                    model: db.Tour,
                    as: "ticket_tour",
                    attributes: {
                        exclude: ["createdAt", "updatedAt"]
                    }
                }
            ],
            attributes: {
                exclude: ["ticketTypeId", "tourId"]
            },
            limit: limit,
            offset: offset
        });

        const totalTicket = await db.Ticket.count({
            where: whereClause,
        });

        for (const e of tickets) {
            let day = DAY_ENUM.NORMAL

            const tourDepartureDate = new Date(e.ticket_tour.departureDate)
            const dayOfWeek = tourDepartureDate.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                day = DAY_ENUM.WEEKEND
            }
            const date = tourDepartureDate.getDate()
            const month = tourDepartureDate.getMonth()
            const dateMonth = `${date}-${month}`
            if (dateMonth.includes(SPECIAL_DAY)) {
                day = DAY_ENUM.HOLIDAY
            }

            const price = await db.Price.findOne({
                where: {
                    ticketTypeId: e.ticket_type.ticketTypeId,
                    day: day
                },
                attributes: ["priceId", "amount", "day"]
            })
            e.dataValues.ticket_type.dataValues.price = price
        }

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get list of tickets successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalTicket
                },
                tickets: tickets
            }
        }

    } catch (error) {
        console.error(error);
    }
}

const getTicketById = async (req) => {
    try {
        const ticketId = req.params.id
        const ticket = await db.Ticket.findOne({
            where: {
                ticketId: ticketId
            },
            include: [
                {
                    model: db.TicketType,
                    as: "ticket_type",
                    attributes: ["ticketTypeId", "ticketTypeName", "description"]
                },
                {
                    model: db.Tour,
                    as: "ticket_tour",
                    attributes: {
                        exclude: ["createdAt", "updatedAt"]
                    }
                }
            ],
            attributes: {
                exclude: ["ticketTypeId", "tourId"]
            }
        });
        let day = DAY_ENUM.NORMAL

        const tourDepartureDate = new Date(ticket.ticket_tour.departureDate)
        const dayOfWeek = tourDepartureDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            day = DAY_ENUM.WEEKEND
        }
        const date = tourDepartureDate.getDate()
        const month = tourDepartureDate.getMonth()
        const dateMonth = `${date}-${month}`
        if (dateMonth.includes(SPECIAL_DAY)) {
            day = DAY_ENUM.HOLIDAY
        }
        const price = await db.Price.findOne({
            where: {
                ticketTypeId: ticket.ticket_type.ticketTypeId,
                day: day
            },
            attributes: ["priceId", "amount", "day"]
        })
        ticket.dataValues.ticket_type.dataValues.price = price

        return {
            status: ticket ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: ticket ? {
                msg: `Get ticket successfully`,
                ticket: ticket
            } : {
                msg: `Ticket not found`,
                ticket: []
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const createTicket = async (req) => {
    try {
        const ticketTypeId = req.body.ticketTypeId
        const tourId = req.body.tourId

        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })
        if (!tour) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour not found!`,
                }
            }
        }
        if (TOUR_STATUS.AVAILABLE !== tour.tourStatus || STATUS.DEACTIVE === tour.status) {
            return {
                status: StatusCodes.CONFLICT,
                data: {
                    msg: `Tour started or Deactive`,
                }
            }
        }

        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })
        if (!ticketType) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Ticket type not found!`,
                }
            }
        }

        let day = DAY_ENUM.NORMAL
        const tourDepartureDate = new Date(tour.departureDate)
        const dayOfWeek = tourDepartureDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            day = DAY_ENUM.WEEKEND
        }
        const date = tourDepartureDate.getDate()
        const month = tourDepartureDate.getMonth()
        const dateMonth = `${date}-${month}`
        if (dateMonth.includes(SPECIAL_DAY)) {
            day = DAY_ENUM.HOLIDAY
        }

        const price = await db.Price.findOne({
            where: {
                ticketTypeId: ticketType.ticketTypeId,
                day: day,
            }
        })
        if (!price) {
            return {
                status: StatusCodes.CONFLICT,
                data: {
                    msg: `Ticket type doesn't have a price for day: ${tour.departureDate}(${day})`,
                }
            }
        }
        const [ticket, created] = await db.Ticket.findOrCreate({
            where: {
                ticketTypeId: ticketTypeId,
                tourId: tourId
            },
            defaults: { ticketTypeId: ticketTypeId, tourId: tourId }
        });
        return {
            status: created ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: created ? `Create ticket successfully for tour: ${tourId}` : `Ticket already exists in tour: ${tourId}`,
                ticket: created ? ticket : {}
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const updateTicket = async (req) => {
    const t = await db.sequelize.transaction();
    try {
        const ticketId = req.params.id
        const ticketTypeId = req.body.ticketTypeId || ""
        const status = req.body.status
        const updateTicket = {}

        const ticket = await db.Ticket.findOne({
            raw: true,
            nest: true,
            where: {
                ticketId: ticketId,
            },
            include: {
                model: db.Tour,
                as: "ticket_tour",
                attributes: ["departureDate"]
            }
        });

        if (!ticket) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Ticket not found!`,
                }
            }
        }

        if (ticketTypeId.trim() !== "") {
            const ticketType = await db.TicketType.findOne({
                where: {
                    ticketTypeId: ticketTypeId
                }
            })

            if (!ticketType) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: `Ticket type not found!`
                    }
                }
            }
            let day = DAY_ENUM.NORMAL
            const tourDepartureDate = new Date(ticket.ticket_tour.departureDate)
            const dayOfWeek = tourDepartureDate.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                day = DAY_ENUM.WEEKEND
            }
            const date = tourDepartureDate.getDate()
            const month = tourDepartureDate.getMonth()
            const dateMonth = `${date}-${month}`
            if (dateMonth.includes(SPECIAL_DAY)) {
                day = DAY_ENUM.HOLIDAY
            }

            const price = await db.Price.findOne({
                where: {
                    ticketTypeId: ticketTypeId,
                    day: day,
                }
            })
            if (!price) {
                return {
                    status: StatusCodes.CONFLICT,
                    data: {
                        msg: `Ticket type doesn't have a price for day: ${tourDepartureDate}`,
                    }
                }
            }
            const dupTicket = await db.Ticket.findOne({
                where: {
                    tourId: ticket.tourId,
                    ticketTypeId: ticketType.ticketTypeId,
                    status: STATUS.ACTIVE
                },
            })

            if (dupTicket) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Ticket Type existed in tour!`
                    }
                }
            }
            updateTicket.ticketTypeId = ticketTypeId
        }

        if (status.trim() !== "") {
            if (ticket.status === status) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Status is already ${status}`,
                    }
                }
            } 
            if (STATUS.DEACTIVE === status) {
                const tickets = await db.Ticket.findAll({
                    where: {
                        tourId: tourId,
                        status: STATUS.ACTIVE
                    }
                })

                if (tickets.length < 2) {
                    return {
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: `Cannot update ticket status to "Deactive" because tour ${tour.tourId} need to has atleast 1 available ticket`,

                        }
                    }
                }
            }
        }

        await db.Ticket.update(updateTicket, {
            where: {
                ticketId: ticket.ticketId
            }, individualHooks: true, transaction: t
        })

        await t.commit()

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Update ticket successfully",
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error);
    }
}

const deleteTicket = async (req) => {
    try {
        const ticketId = req.params.id
        const ticket = await db.Ticket.findOne({
            where: {
                ticketId: ticketId
            }
        })
        if (!ticket) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Ticket not found with id ${ticketId}`,
                }
            }
        }

        const tickets = await db.Ticket.findAll({
            where: {
                tourId: ticket.tourId
            }
        })

        const activeTickets = tickets.filter((ticket) => ticket.status === STATUS.ACTIVE)
        if (activeTickets.length < 2) {
            return {
                status: StatusCodes.CONFLICT,
                data: {
                    msg: `Cannot delete ticket because tour ${tour.tourId} need to has atleast 1 available ticket`,
                }
            }
        }

        await db.Ticket.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                ticketId: ticket.ticketId
            },
            individualHooks: true
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Delete ticket successfully",
            }
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };