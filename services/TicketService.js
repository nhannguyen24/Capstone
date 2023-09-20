const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
// const getAllTickets = (req) => new Promise(async (resolve, reject) => {
//     try {
//         const tickets = await db.Ticket.findAll(
//             {
//                 include: [
//                     {
//                         model: db.TicketType,
//                         as: "ticket_type",
//                     },
//                 ],
//                 attributes: {
//                     exclude: ["ticketTypeId", "toudId", "customerId"]
//                 }
//             }
//         );
        
//         const processedTickets = tickets.map(async (ticket) => {
//             const prices = await db.Price.findAll({
//                 where: {
//                     ticketTypeId: ticket.ticket_type.ticketTypeId
//                 }
                
//             });
//             ticket.ticket_type.price = prices;
//         });

//         resolve({
//             status: 200,
//             data: processedTickets.length > 0 ? {
//                 msg: `Get list of tickets successfully`,
//                 tickets: processedTickets
//             } : {
//                 msg: `Ticket not found`,
//                 tickets: []
//             }
//         });

//     } catch (error) {
//         reject(error);
//     }
// });

const getAllTickets = (req) => new Promise(async (resolve, reject) => {
    try {
        const tickets = await db.Ticket.findAll(
            {
                include: [
                    {
                        model: db.TicketType,
                        as: "ticket_type",
                    },
                ],
                attributes: {
                    exclude: ["ticketTypeId", "toudId", "customerId"]
                }
            }
        );


        const pricePromises = tickets.map(async (element) => {
            const prices = await db.Price.findAll({
                where: {
                    ticketTypeId: element.ticket_type.ticketTypeId
                },
                attributes: {
                    exclude: ["ticketTypeId"]
                }
            })
            element.dataValues.ticket_type.dataValues.prices = prices
            return element
        })

        const ticketsWithPrices = await Promise.all(pricePromises)

        resolve({
            status: 200,
            data: ticketsWithPrices.length > 0 ? {
                msg: `Get list of tickets successfully`,
                tickets: ticketsWithPrices
            } : {
                msg: `Ticket not found`,
                tickets: []
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
            }
        });
        resolve({
            status: 200,
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
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })
        if (!ticketType) {
            resolve({
                status: 400,
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

        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })
        if (!tour) {
            resolve({
                status: 400,
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
                status: 400,
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
                status: 400,
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
                status: 400,
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

            const activeTickets = tickets.filter((ticket) => ticket.status === "Active")
            if (activeTickets.length < 2) {
                resolve({
                    status: 400,
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
                status: 400,
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

        const activeTickets = tickets.filter((ticket) => ticket.status === "Active")
        if (activeTickets.length < 2) {
            resolve({
                status: 400,
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