const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum");
const { StatusCodes } = require('http-status-codes');

const getTicketTypes = async (req) => {
    try {
        const ticketTypes = await db.TicketType.findAll();
        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get list of ticket types successfully`,
                ticketTypes: ticketTypes
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const getTicketTypeById = async (req) => {
    try {
        const ticketTypeId = req.params.id
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        });
        return {
            status: ticketType ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: ticketType ? {
                msg: `Get ticket type successfully`,
                ticketType: ticketType
            } : {
                msg: `Ticket type not found!`,
                ticketType: {}
            }
        }

    } catch (error) {
        console.error(error);
    }
}

const createTicketType = async (req) => {
    try {
        const ticketTypeName = req.body.ticketTypeName
        const description = req.body.description

        const [ticketType, created] = await db.TicketType.findOrCreate({
            where: {
                ticketTypeName: {
                    [Op.like]: ticketTypeName
                }
            },
            defaults: { ticketTypeName: ticketTypeName, description: description }
        });

        return {
            status: created ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: created ? 'Create ticket type successfully' : 'Ticket type already exists',
                ticketType: ticketType
            }
        }
    } catch (error) {
        console.error(error)
    }
}

const updateTicketType = async (req) => {
    const t = await db.sequelize.transaction();
    try {
        const ticketTypeId = req.params.id
        const ticketTypeName = req.body.ticketTypeName || ""
        const description = req.body.description || ""
        const updateTicketType = {}

        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })

        if (!ticketType) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Ticket Type not found!`,
                }
            }
        }

        if (ticketTypeName !== "") {
            const ticketType = await db.TicketType.findOne({
                where: {
                    ticketTypeName: {
                        [Op.like]: ticketTypeName
                    }
                }
            })

            if (ticketType) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Name existed`,
                    }
                }
            }
            updateTicketType.ticketTypeName = ticketTypeName

        }

        if (description !== "") {
            updateTicketType.description = description
        }

        await db.TicketType.update(updateTicketType, {
            where: {
                ticketTypeId: ticketTypeId
            }, individualHooks: true, transaction: t
        })

        await t.commit()

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Update ticket type successfully",
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error);
    }
}

module.exports = { getTicketTypes, getTicketTypeById, createTicketType, updateTicketType };