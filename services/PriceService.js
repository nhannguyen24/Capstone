const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const DAY = require("../enums/PriceDayEnum")
const getAllPrices = (req) => new Promise(async (resolve, reject) => {
    try {
        const prices = await db.Price.findAll();

        resolve({
            status: 200,
            data: {
                msg: `Get list of the prices successfully`,
                prices: prices
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getPriceById = (req) => new Promise(async (resolve, reject) => {
    try {
        const priceId = req.params.priceId
        const price = await db.Price.findOne({
            where: {
                priceId: priceId
            }
        });

        resolve({
            status: price ? 200 : 404,
            data: price ? {
                msg: `Get price successfully`,
                price: price
            } : {
                msg: `Price not found`,
                price: {}
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createPrice = (req) => new Promise(async (resolve, reject) => {
    try {
        const amount = req.body.amount
        const ticketTypeId = req.body.ticketTypeId
        const day = req.body.day

        const ticketType = await db.TicketType.findOne({
            where: {
                ticketTypeId: ticketTypeId
            }
        })

        if (!ticketType) {
            resolve({
                status: 404,
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
            defaults: { ticketTypeId: ticketTypeId, amount: amount, day: day }
        });

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create price successfully' : 'Price already exists',
                price: created ? price : {}
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
                status: 404,
                data: {
                    msg: `Price not found with id ${priceId}`,
                }
            })
        }

        var ticketTypeId = req.query.ticketTypeId
        if (ticketTypeId === undefined || ticketTypeId === null) {
            ticketTypeId = price.ticketTypeId
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
                    msg: `TicketType not found with id ${ticketTypeId}`,
                }
            })
        }

        var amount = req.query.amount
        if (amount === undefined || amount === null) {
            amount = price.amount
        }

        var day = req.query.day
        if (day === undefined || day === null) {
            day = price.day
        }

        await db.Price.update({
            amount: amount,
            ticketTypeId: ticketType.ticketTypeId,
            day: day
        }, {
            where: {
                priceId: price.priceId
            }, individualHooks: true, transaction: t
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
                status: 404,
                data: {
                    msg: `Price not found with id ${priceId}`,
                }
            })
        }

        await db.Price.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                priceId: price.priceId
            }, individualHooks: true
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


module.exports = { getAllPrices, getPriceById, createPrice, updatePrice, deletePrice };