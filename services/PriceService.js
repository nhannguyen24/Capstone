const db = require('../models')
const { Op } = require('sequelize')
const { StatusCodes } = require('http-status-codes');

const getPrices = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = parseInt((page - 1) * limit)
        const ticketTypeId = req.query.ticketTypeId || ""
        const status = req.query.status || ""

        const whereClause = {}

        if (ticketTypeId !== "") {
            const ticketType = await db.TicketType.findOne({
                where: {
                    ticketTypeId: ticketTypeId
                }
            })

            if (!ticketType) {
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: "Ticket type not found!",
                    }
                }
            }
            whereClause.ticketTypeId = ticketTypeId
        }



        if (status !== "") {
            whereClause.status = status
        }

        const prices = await db.Price.findAll({
            where: whereClause,
            order: [["updatedAt", "DESC"]],
            include: {
                model: db.TicketType,
                as: "price_ticket_type",
                attributes: {
                    exclude: ["createdAt", "updatedAt"]
                }
            },
            attributes: {
                exclude: ["ticketTypeId"]
            },
            offset: offset,
            limit: limit
        })

        const totalPrice = await db.Price.count({
            where: whereClause,
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get prices successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalPrice
                },
                prices: prices
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

const getPriceById = async (priceId) => {
    try {
        const price = await db.Price.findOne({
            where: {
                priceId: priceId
            },
            include: {
                model: db.TicketType,
                as: "price_ticket_type",
                attributes: {
                    exclude: ["createdAt", "updatedAt"]
                }
            },
            attributes: {
                exclude: ["ticketTypeId"]
            },
        })

        return {
            status: price ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: price ? {
                msg: `Get price successfully`,
                price: price
            } : {
                msg: `Price not found!`,
                price: {}
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

const createPrice = async (req) => {
    try {
        const amount = req.body.amount
        const ticketTypeId = req.body.ticketTypeId

        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })

        if (!ticketType) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `TicketType not found!`,
                }
            }
        }

        const price = await db.Price.findOne({
            where: {
                ticketTypeId: ticketTypeId,
            }
        })

        if (price) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Duplicate price!`,
                }
            }
        }
        const roundedAmount = Math.floor(amount / 1000) * 1000
        const created = await db.Price.create({ ticketTypeId: ticketTypeId, amount: roundedAmount})

        return {
            status: StatusCodes.CREATED,
            data: {
                msg: 'Create price successfully',
                price: created
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

const updatePrice = async (req) => {
    const t = await db.sequelize.transaction()
    try {
        const priceId = req.params.id
        const ticketTypeId = req.params.ticketTypeId
        const amount = parseInt(req.body.amount) || ""

        const whereClause = {}
        const updatePrice = {}

        const price = await db.Price.findOne({
            where: {
                priceId: priceId,
                ticketTypeId: ticketTypeId,
            }
        })

        if (!price) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Price not found!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        const price_result = await db.Price.findAll({
            where: {
                priceId: priceId,
                ticketTypeId: ticketTypeId,
            },
            include: {
                model: db.TicketType,
                as: "price_ticket_type",
                include: {
                    model: db.Ticket,
                    as: "type_ticket",
                    include: {
                        model: db.Tour,
                        as: "ticket_tour",
                        attributes: ["tourId", "tourName", "tourStatus", "departureDate"],
                        include: {
                            model: db.Schedule,
                            as: "tour_schedule",
                            where: whereClause,
                        }
                    }

                }
            }
        })

        const ticket_list = price_result[0].price_ticket_type.type_ticket

        // const forbiddenTicket = ticket_list.find((ticket) => {
        //     const departureDate = new Date(ticket.ticket_tour.departureDate);
        //     const dayOfWeek = departureDate.getDay();
        //     const date = departureDate.getDate();
        //     const month = departureDate.getMonth();
        //     const dateMonth = `${date}-${month}`;

        //     if (DAY_ENUM.NORMAL === day) {
        //         if (!SPECIAL_DAY.includes(dateMonth) && [1, 2, 3, 4, 5].includes(dayOfWeek)) {
        //             return true;
        //         }
        //     }

        //     if (DAY_ENUM.WEEKEND === day) {
        //         if (!SPECIAL_DAY.includes(dateMonth) && [0, 6].includes(dayOfWeek)) {
        //             return true;
        //         }
        //     }

        //     if (DAY_ENUM.HOLIDAY === day && SPECIAL_DAY.includes(dateMonth)) {
        //         return true;
        //     }

        //     return false;
        // })

        if (forbiddenTicket) {
            return {
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: "Cannot update price because price is currently in use"
                }
            };
        }

        if (amount !== "") {
            updatePrice.amount = amount
        }

        await db.Price.update(updatePrice, {
            where: {
                priceId: price.priceId
            }, individualHooks: true, transaction: t
        })

        await t.commit()

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Update price successfully",
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getPrices, getPriceById, createPrice, updatePrice }
