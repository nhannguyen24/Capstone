const db = require('../models');
const { Op } = require('sequelize');

const getTransactions = (req) => new Promise(async (resolve, reject) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = parseInt((page - 1) * limit)
        const transactionCode = req.query.transactionCode || ""
        const isSuccess = req.query.isSuccess || ""
        const status = req.query.status || ""

        let whereClause = {}

        if(transactionCode !== ""){
            whereClause.transactionCode = transactionCode
        }

        if(isSuccess !== ""){
            if(isSuccess === "true") {
                isSuccess = 1
            } else if(isSuccess === "false"){
                isSuccess = 0
            }
            whereClause.isSuccess = isSuccess
        }

        if(status !== ""){
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
                    attributes: {exclude: ["createdAt", "updatedAt"]}
                }
            ],
            limit: limit,
            offset: offset
        });

        resolve({
            status: 200,
            data: {
                msg: `Get transactions successfully`,
                paging: {
                    page: page,
                    limit: limit
                },
                transactions: transactions
            }
        });

    } catch (error) {
        reject(error);
    }
});
const getTransactionById = (req) => new Promise(async (resolve, reject) => {
    try {
        const transactionId = req.params.id
        const transactions = await db.Transaction.findOne({
            where: {
                transtionId: transactionId
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

        resolve({
            status: 200,
            data: {
                msg: `Get list of transactions successfully`,
                transactions: transactions
            }
        });

    } catch (error) {
        reject(error);
    }
});

module.exports = { getTransactions, getTransactionById };