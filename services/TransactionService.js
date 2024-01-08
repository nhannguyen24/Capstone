const { StatusCodes } = require('http-status-codes');
const db = require('../models');
const STATUS = require('../enums/StatusEnum')
const TRANSACTION_TYPE = require('../enums/TransactionTypeEnum')
const { Op } = require('sequelize');

const getTransactions = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const bookingId = req.query.bookingId || ""
        const transactionCode = req.query.transactionCode || ""
        const transactionType = req.query.transactionType || ""
        const status = req.query.status || ""

        let whereClause = {}

        if (transactionCode.trim() !== "") {
            whereClause.transactionCode = transactionCode
        }

        if (transactionType.trim() !== "") {
            whereClause.transactionType = transactionType
        }

        if (bookingId.trim() !== "") {
            whereClause.bookingId = bookingId
        }

        if (status !== "") {
            whereClause.status = status
        }

        const transactions = await db.Transaction.findAll({
            where: whereClause,
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "transaction_booking",
                    attributes: { exclude: ["createdAt", "updatedAt"] }
                }
            ],
            limit: limit,
            offset: offset
        });

        const totalTrans = await db.Transaction.count({
            where: whereClause,
        });

        return {
            status: StatusCodes.OK,
            data: {
                msg: `Get transactions successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalTrans
                },
                transactions: transactions
            }
        }

    } catch (error) {
        console.error(error);
    }
}

const getTransactionById = async (transactionId) => {
    try {
        const transaction = await db.Transaction.findOne({
            where: {
                transactionId: transactionId
            },
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "transaction_booking",
                }
            ],
            attributes: {
                exclude: ["bookingId"]
            }
        });

        return {
            status: transaction ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: transaction ? {
                msg: `Get list of transactions successfully`,
                transaction: transaction
            } : {
                msg: `Transaction not found!`,
                transaction: {}
            }
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = { getTransactions, getTransactionById, }