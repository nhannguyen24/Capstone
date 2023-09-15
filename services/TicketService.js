const db = require('../models');
const { Op } = require('sequelize');

const getAllTickets = (req) => new Promise(async (resolve, reject) => {
    try {
        const tickets = await db.Ticket.findAll();
        resolve({
            status: 200,
            data: tickets.length > 0 ? {
                msg: `Get list of tickets successfully`,
                tickets: tickets
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
            if ("Deactive" == ticketType.status) {
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
        if (!tourId) {
            resolve({
                status: 400,
                data: {
                    msg: `Tour not found with id ${tourId}`,
                }
            })
        } else {
            if ("NotStarted" != tour.tourStatus || "Deactive" == tour.status) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Tour is already started or "Deactive"`,
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
                ticket: ticket
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
            if ("Deactive" == ticketType.status) {
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
            tourId = ticketType.tourId
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
            if ("NotStarted" != tour.tourStatus || "Deactive" == tour.status) {
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

        if ("Deactive" == status) {
            const tickets = await db.Ticket.findAll({
                where: {
                    tourId: tourId
                }
            })

            const activeTickets = tickets.filter((ticket) => ticket.status === "Active")
            if (activeTickets.length() < 2) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Cannot update ticket status to "Deactive" because tour need to has atleast 1 available ticket`,
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
            }, transaction: t
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
        if(!ticket){
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
        if (activeTickets.length() < 2) {
            resolve({
                status: 400,
                data: {
                    msg: `Cannot delete ticket because tour need to has atleast 1 available ticket`,
                }
            })
        }

        await db.Ticket.update({
            status: "Deactive"
        }, {
            where: {
                ticketId: ticket.ticketId
            }
        })

    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllTickets, getTicketById, createTicket, updateTicket, deleteTicket };