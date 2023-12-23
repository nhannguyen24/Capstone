const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const { StatusCodes } = require('http-status-codes');

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
        })

        const totalTicket = await db.Ticket.count({
            where: whereClause,
        });

        for (let ticket of tickets) {
            const prices = await db.Price.findAll({
                raw: true,
                nest: true,
                where: {
                    ticketTypeId: ticket.ticket_type.ticketTypeId,
                },
                attributes: ["priceId", "amount", "day"]
            })
            ticket.ticket_type.prices = prices
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
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const getTicketById = async (ticketId) => {
    try {
        const ticket = await db.Ticket.findOne({
            raw: true,
            nest: true,
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
        
        const prices = await db.Price.findAll({
            where: {
                ticketTypeId: ticket.ticket_type.ticketTypeId,
            },
            attributes: ["priceId", "amount", "day"]
        })
        ticket.ticket_type.prices = prices

        return {
            status: ticket ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: ticket ? {
                msg: `Get ticket successfully`,
                ticket: ticket
            } : {
                msg: `Ticket not found`,
                ticket: {}
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
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

        const prices = await db.Price.findAll({
            where: {
                ticketTypeId: ticketType.ticketTypeId,
            }
        })
        if (prices.length === 0) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Ticket type doesn't have prices`,
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
                msg: created ? `Create ticket successfully!` : `Ticket already exists in tour!`,
                ticket: created ? ticket : {}
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
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
        const checkBookedTicket = await db.bookingDetail.findOne({
            where: {
                ticketId: ticketId,
                status: STATUS.ACTIVE
            }
        })

        if(checkBookedTicket){
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot update, ticket has already been booked!`,
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

            const prices = await db.Price.findAll({
                where: {
                    ticketTypeId: ticketType.ticketTypeId,
                }
            })
            if (prices.length === 0) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Ticket type doesn't have prices`,
                    }
                }
            }
            const dupTicket = await db.Ticket.findOne({
                where: {
                    tourId: ticket.tourId,
                    ticketTypeId: ticketType.ticketTypeId,
                    status: STATUS.ACTIVE,
                    ticketId: {
                        [Op.ne]: ticketId
                    }
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
            if (STATUS.DEACTIVE === status) {
                const tickets = await db.Ticket.findAll({
                    where: {
                        tourId: ticket.tourId,
                        status: STATUS.ACTIVE
                    }
                })

                if (tickets.length < 2) {
                    return {
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: `Cannot update ticket status to "Deactive" because tour need to has atleast 1 available ticket`,
                        }
                    }
                }
            }
            updateTicket.status = status
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
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const deleteTicket = async (ticketId) => {
    try {
        const ticket = await db.Ticket.findOne({
            where: {
                ticketId: ticketId
            }
        })
        if (!ticket) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Ticket not found!`,
                }
            }
        }

        const checkBookedTicket = await db.BookingDetail.findOne({
            where: {
                ticketId: ticketId,
                status: STATUS.ACTIVE
            }
        })

        if(checkBookedTicket){
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot update, ticket has already been booked!`,
                }
            }
        }

        const tickets = await db.Ticket.findAll({
            where: {
                tourId: ticket.tourId,
                status: STATUS.ACTIVE
            }
        })

        if (tickets.length < 2) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot delete ticket because tour need to has atleast 1 available ticket`,
                }
            }
        }

        await db.Ticket.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                ticketId: ticketId
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
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };