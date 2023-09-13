const db = require('../models');
const { Op } = require('sequelize');

const getAllPrices = (req) => new Promise(async (resolve, reject) => {
    try {
        const prices = await db.Price.findAll();

            resolve({
                status: 200,
                data: prices.length > 0 ? {
                    msg: `Prices found`,
                    prices: prices
                } : {
                    msg: `Prices not found`,
                    prices: []
                }
            });

    } catch (error) {
        reject(error);
    }
});

const createPrice = (req) => new Promise(async (resolve, reject) => {
    try {
        const ammount = req.body.ammount
        const ticketTypeId = req.body.ticketTypeId
        const day = req.body.day

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

        const [price, created] = await db.Price.findOrCreate({
            where: {
                ticketTypeId: ticketTypeId,
                day: day
            },
            defaults: { ticketTypeId: ticketTypeId, ammount: ammount, day: day }
        });

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create price successfully' : 'Price already exists',
                price: price
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updatePrice = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const priceId = req.params.priceId
        const price = await db.Price.findOne({
            where: {
                priceId: priceId
            }
        })

        if (!price) {
            resolve({
                status: 400,
                data: {
                    msg: `Price not found with id ${priceId}`,
                }
            })
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
                    msg: `TicketType not found with id ${ticketTypeId}`,
                }
            })
        }

        var ammount = req.query.ammount
        if (ammount === undefined || ammount === null) {
            ammount = price.ammount
        }

        var ticketTypeId = req.query.ticketTypeId
        if (ticketTypeId === undefined || ticketTypeId === null) {
            ticketTypeId = price.ticketTypeId
        }

        var day = req.query.day
        if (day === undefined || day === null) {
            day = price.day
        }

        await db.Price.update({
            ammount: ammount,
            ticketTypeId: ticketType.ticketTypeId,
            day: day
        }, {
            where: {
                priceId: price.priceId
            }, transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update price successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const deletePrice = (req) => new Promise(async (resolve, reject) => {
    try {
        const priceId = req.params.priceId
        const price = await db.Price.findOne({
            where: {
                priceId: priceId
            }
        })

        if (!price) {
            resolve({
                status: 400,
                data: {
                    msg: `Price not found with id ${priceId}`,
                }
            })
        }

        await db.Price.update({
            status: "Deactive"
        }, {
            where: {
                priceId: price.priceId
            }
        })

        resolve({
            status: 200,
            data: {
                msg: "Delete price successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllPrices, createPrice, updatePrice, deletePrice };