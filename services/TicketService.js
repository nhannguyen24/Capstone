const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const DAY_ENUM = require("../enums/PriceDayEnum")
const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const getAllTickets = (req) => new Promise(async (resolve, reject) => {
    try {
        const tickets = await db.Ticket.findAll(
            {
                include: [
                    {
                        model: db.TicketType,
                        as: "ticket_type",
                    },
                    {
                        model: db.Tour,
                        as: "ticket_tour",
                    }
                ],
                attributes: {
                    exclude: ["ticketTypeId", "tourId", "customerId"]
                }
            }
        );

        for (const e of tickets) {
            const prices = await db.Price.findAll({
                where: {
                    ticketTypeId: e.ticket_type.ticketTypeId,
                },
                attributes: {
                    exclude: ["ticketTypeId"]
                }
            })
            e.dataValues.ticket_type.dataValues.prices = prices
        }

        resolve({
            status: 200,
            data: {
                msg: `Get list of tickets successfully`,
                tickets: tickets
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getTicketById = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketId = req.params.ticketId
        const ticket = await db.Ticket.findOne({
            where: {
                ticketId: ticketId
            },
            include: [
                {
                    model: db.TicketType,
                    as: "ticket_type",
                },
                {
                    model: db.Tour,
                    as: "ticket_tour",
                }
            ],
            attributes: {
                exclude: ["ticketTypeId", "tourId", "customerId"]
            }
        });

        const prices = await db.Price.findAll({
            where: {
                ticketTypeId: ticket.ticket_type.ticketTypeId,
            },
            attributes: {
                exclude: ["ticketTypeId"]
            }
        })
        ticket.dataValues.ticket_type.dataValues.prices = prices

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
                    msg: `Tour not found with id ${tourId}`,
                }
            })
        } else {
            if (TOUR_STATUS.NOT_STARTED !== tour.tourStatus || STATUS.DEACTIVE === tour.status) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Tour is already started or Deactive`,
                    }
                })
            }
        }
//
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })
        if (!ticketType) {
            resolve({
                status: 404,
                data: {
                    msg: `Ticket type not found with id ${ticketTypeId}`,
                }
            })
        }
        if (STATUS.DEACTIVE == ticketType.status) {
            resolve({
                status: 409,
                data: {
                    msg: `Ticket type is "Deactive"`,
                }
            })
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

        const prices = await db.Price.findOne({
            where: {
                ticketTypeId: ticketType.ticketTypeId,
                day: day,
            }
        })
        if (!prices) {
            resolve({
                status: 409,
                data: {
                    msg: `Ticket type doesn't have a price for day: ${tour.departureDate}(${day})`,
                }
            })
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
        const ticketId = req.params.ticketId
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
        }

        var ticketTypeId = req.query.ticketTypeId
        if (ticketTypeId === undefined || ticketTypeId === null) {
            ticketTypeId = ticket.ticketTypeId
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
                    msg: `Ticket type not found with id ${ticketTypeId}`,
                }
            })
        } else {
            if (STATUS.DEACTIVE == ticketType.status) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Ticket type is "Deactive"`,
                    }
                })
            }
        }

        var tourId = req.query.tourId
        if (tourId === undefined || tourId === null) {
            tourId = ticket.tourId
        }

        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })
        if (!tourId) {
            resolve({
                status: 404,
                data: {
                    msg: `Tour not found with id ${tourId}`,
                }
            })
        } else {
            if (TOUR_STATUS.NOT_STARTED != tour.tourStatus || STATUS.DEACTIVE == tour.status) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Tour is already started or "Deactive"`,
                    }
                })
            }
        }

        var status = req.query.status
        if (status === undefined || status === null) {
            status = ticketType.status
        }

        if (STATUS.DEACTIVE == status) {
            const tickets = await db.Ticket.findAll({
                where: {
                    tourId: tourId
                }
            })

            const activeTickets = tickets.filter((ticket) => ticket.status === STATUS.ACTIVE)
            if (activeTickets.length < 2) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Cannot update ticket status to "Deactive" because tour ${tour.tourId} need to has atleast 1 available ticket`,

                    }
                })
            }
        }


        await db.Ticket.update({
            ticketTypeId: ticketType.ticketTypeId,
            tourId: tour.tourId,
            status: status
        }, {
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
        const ticketId = req.params.ticketId
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
        }

        await db.Ticket.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                ticketId: ticket.ticketId
            },
            individualHooks: true
        })

    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket };