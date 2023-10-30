const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const DAY = require("../enums/PriceDayEnum")
const getPrices = (req) => new Promise(async (resolve, reject) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = parseInt((page - 1) * limit)
        const day = req.query.day || ""
        const status = req.query.status || ""

        const whereClause = {}

        if (day !== "") {
            whereClause.day = day
        }

        if (status !== "") {
            whereClause.status = status
        }

        const prices = await db.Price.findAll({
            where: whereClause,
            order: [["updatedAt", "DESC"]],
            offset: offset,
            limit: limit
        });

        const totalPrice = await db.Price.count({
            where: whereClause,
        });

        resolve({
            status: 200,
            data: {
                msg: `Get prices successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalPrice
                },
                prices: prices
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getPriceById = (req) => new Promise(async (resolve, reject) => {
    try {
        const priceId = req.params.id
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
                    msg: `TicketType not found with id "${ticketTypeId}"`,
                }
            })
            return
        }

        const price = await db.Price.create({ ticketTypeId: ticketTypeId, amount: amount, day: day });

        resolve({
            status: 201,
            data: {
                msg: 'Create price successfully',
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
        const priceId = req.params.id
        const ticketTypeId = req.body.ticketTypeId || ""
        const amount = parseInt(req.body.amount) || ""
        const day = req.body.day || ""

        const updatePrice = {}

        const price = await db.Price.findOne({
            where: {
                priceId: priceId,
                ticketTypeId: ticketTypeId
            }
        })

        if (!price) {
            resolve({
                status: 404,
                data: {
                    msg: `Price not found!`,
                }
            })
        }

        if (amount !== "") {
            updatePrice.amount = amount
        }

        if (day !== "") {
            updatePrice.day = day
        }

        await db.Price.update(updatePrice, {
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

module.exports = { getPrices, getPriceById, createPrice, updatePrice };