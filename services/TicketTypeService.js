const db = require('../models');
const { Op } = require('sequelize');

const getAllTicketTypes = (req) => new Promise(async (resolve, reject) => {
    try {
        const ticketTypes = await db.TicketType.findAll();

    
            resolve({
                status: 200,
                data: ticketTypes.length > 0 ? {
                    msg: `Get list of ticket type successfully`,
                    ticketTypes: ticketTypes
                }:{
                    msg: `Ticket type not found`,
                    ticketTypes: []
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
                status: 400,
                data: {
                    msg: `TicketType not found with id ${ticketTypeId}`,
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
            }

        var description = req.query.description
        if (description === undefined || description === null) {
            description = ticketType.description
        }
        // var status = req.query.status
        // if (status === undefined || status === null) {
        //     status = ticketType.status
        // }
        // if("Deactive" == status){
        //     const prices = await db.Price.findAll({
        //         where: {
        //             ticketTypeId: ticketType.ticketTypeId,
        //             status: {
        //                 [Op.like]: "Active"
        //             }
        //         },
        //     })
        //     if(prices){
        //         resolve({
        //             status: 409,
        //             data: {
        //                 msg: `Cannot update ticket type status to Deactive because it currently has in-use prices`,
        //                 prices: prices
        //             }
        //         })
        //     }

        // }

        await db.TicketType.update({
            ticketTypeName: ticketTypeName,
            description: description,
        }, {
            where: {
                ticketTypeId: ticketType.ticketTypeId
            }, transaction: t
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

// const deleteTicketType = (req) => new Promise(async (resolve, reject) => {
//     try {
//         const priceId = req.params.priceId
//         const status = req.query.status
//         const price = await db.Price.findOne({
//             where: {
//                 priceId: priceId
//             }
//         })

//         if (!price) {
//             resolve({
//                 status: 400,
//                 data: {
//                     msg: `Price not found with id ${priceId}`,
//                 }
//             })
//         }

//         await db.Price.update({
//             status: status
//         }, {
//             where: {
//                 priceId: price.priceId
//             }
//         })

//         resolve({
//             status: 200,
//             data: {
//                 msg: "Update bus status successfully",
//             }
//         })


//     } catch (error) {
//         reject(error);
//     }
// });


module.exports = { getAllTicketTypes, createTicketType, updateTicketType };