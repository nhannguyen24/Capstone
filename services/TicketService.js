const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const getTickets = (req) => new Promise(async (resolve, reject) => {
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

        resolve({
            status: 200,
            data: {
                msg: `Get list of tickets successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalTicket
                },
                tickets: tickets
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getTicketById = (req) => new Promise(async (resolve, reject) => {
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

        resolve({
            status: ticket ? 200 : 404,
            data: ticket ? {
                msg: `Get ticket successfully`,
                ticket: ticket
            } : {
                msg: `Ticket not found`,
                ticket: []
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createTicket = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketTypeId = req.body.ticketTypeId
        const tourId = req.body.tourId

        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })
        if (!tour) {
            resolve({
                status: 404,
                data: {
                    msg: `Tour not found!`,
                }
            })
            return
        } else {
            if (TOUR_STATUS.AVAILABLE !== tour.tourStatus || STATUS.DEACTIVE === tour.status) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Tour started or Deactive`,
                    }
                })
                return
            }
        }
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })
        if (!ticketType) {
            resolve({
                status: 404,
                data: {
                    msg: `Ticket type not found!`,
                }
            })
            return
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
            resolve({
                status: 409,
                data: {
                    msg: `Ticket type doesn't have a price for day: ${tour.departureDate}(${day})`,
                }
            })
            return
        } else {
            const [ticket, created] = await db.Ticket.findOrCreate({
                where: {
                    ticketTypeId: ticketTypeId,
                    tourId: tourId
                },
                defaults: { ticketTypeId: ticketTypeId, tourId: tourId }
            });
            resolve({
                status: created ? 201 : 400,
                data: {
                    msg: created ? `Create ticket successfully for tour: ${tourId}` : `Ticket already exists in tour: ${tourId}`,
                    ticket: created ? ticket : {}
                }
            });
        }
    } catch (error) {
        reject(error);
    }
});

const updateTicket = (req) => new Promise(async (resolve, reject) => {
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
            resolve({
                status: 404,
                data: {
                    msg: `Ticket not found!`,
                }
            })
            return
        } 

        if(ticketTypeId.trim() !== ""){
            const ticketType = await db.TicketType.findOne({
                where: {
                    ticketTypeId: ticketTypeId
                }
            })

            if(!ticketType){
                resolve({
                    status: 404,
                    data:{
                        msg: `Ticket type not found!`
                    }
                })
            } else {
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
                    resolve({
                        status: 409,
                        data: {
                            msg: `Ticket type doesn't have a price for day: ${tourDepartureDate}`,
                        }
                    })
                    return
                } else {
                    const dupTicket = await db.Ticket.findOne({
                        where: {
                            tourId: ticket.tourId,
                            ticketTypeId: ticketType.ticketTypeId,
                            status: STATUS.ACTIVE
                        },
                    });
    
                    if(dupTicket){
                        resolve({
                            status: 400,
                            data:{
                                msg: `Ticket Type existed in tour!`
                            }
                        })
                    } else {
                        updateTicket.ticketTypeId = ticketTypeId
                    }
                }
            }
        }

        if (status.trim() !== "") {
            if(ticket.status === status){
                resolve({
                    status: 400,
                    data: {
                        msg: `Status is already ${status}`,
                    }
                })
                return
            } else if (STATUS.DEACTIVE === status) {
                const tickets = await db.Ticket.findAll({
                    where: {
                        tourId: tourId,
                        status: STATUS.ACTIVE
                    }
                })

                if (tickets.length < 2) {
                    resolve({
                        status: 400,
                        data: {
                            msg: `Cannot update ticket status to "Deactive" because tour ${tour.tourId} need to has atleast 1 available ticket`,
    
                        }
                    })
                    return
                }
            }
        }

        


        await db.Ticket.update(updateTicket, {
            where: {
                ticketId: ticket.ticketId
            }, individualHooks: true, transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update ticket successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const deleteTicket = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketId = req.params.id
        const ticket = await db.Ticket.findOne({
            where: {
                ticketId: ticketId
            }
        })
        if (!ticket) {
            resolve({
                status: 404,
                data: {
                    msg: `Ticket not found with id ${ticketId}`,
                }
            })
            return
        }

        const tickets = await db.Ticket.findAll({
            where: {
                tourId: ticket.tourId
            }
        })

        const activeTickets = tickets.filter((ticket) => ticket.status === STATUS.ACTIVE)
        if (activeTickets.length < 2) {
            resolve({
                status: 409,
                data: {
                    msg: `Cannot delete ticket because tour ${tour.tourId} need to has atleast 1 available ticket`,
                }
            })
            return
        }

        await db.Ticket.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                ticketId: ticket.ticketId
            },
            individualHooks: true
        })

        resolve({
            status: 200,
            data: {
                msg: "Delete ticket successfully",
            }
        })

    } catch (error) {
        reject(error);
    }
});


module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };