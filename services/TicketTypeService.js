const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")

const getAllTicketTypes = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketTypes = await db.TicketType.findAll();
            resolve({
                status: 200,
                data: {
                    msg: `Get list of ticket types successfully`,
                    ticketTypes: ticketTypes
                }
            });
        
    } catch (error) {
        reject(error);
    }
});

const getTicketTypeById = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketTypeId = req.params.ticketTypeId
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        });
            resolve({
                status: ticketType ? 200 : 404,
                data: ticketType ? {
                    msg: `Get ticket type successfully`,
                    ticketType: ticketType
                }:{
                    msg: `Ticket type not found`,
                    ticketType: {}
                }
            });
        
    } catch (error) {
        reject(error);
    }
});

const createTicketType = (req) => new Promise(async (resolve, reject) => {
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

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create ticket type successfully' : 'Ticket type already exists',
                ticketType: ticketType
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateTicketType = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const ticketTypeId = req.params.ticketTypeId
        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })

        if (!ticketType) {
            resolve({
                status: 404,
                data: {
                    msg: `TicketType not found with id "${ticketTypeId}"`,
                }
            })
        }

        var ticketTypeName = req.query.ticketTypeName
        if (ticketTypeName === undefined || ticketTypeName === null) {
            ticketTypeName = ticketType.ticketTypeName
        }

        const result = await db.TicketType.findOne({
            where: {
                ticketTypeName: {
                    [Op.like]: ticketTypeName
                }
            }})

            if(result){
                resolve({
                    status: 400,
                    data: {
                        msg: `Ticket type name already exists`,
                    }
                })
                return
            }

        var description = req.query.description
        if (description === undefined || description === null) {
            description = ticketType.description
        }

        await db.TicketType.update({
            ticketTypeName: ticketTypeName,
            description: description,
        }, {
            where: {
                ticketTypeId: ticketType.ticketTypeId
            }, individualHooks: true, transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update ticket type successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

module.exports = { getAllTicketTypes, getTicketTypeById, createTicketType, updateTicketType };