const db = require('../models');
const { Op } = require('sequelize');

const getTransactions = (req) => new Promise(async (resolve, reject) => {
    try {
        const customerId = req.query.customerId
        const transactions = await db.Transaction.findAll({
            order: [
                ["updatedAt", "DESC"]
            ],
            include: [
                {
                    model: db.Booking,
                    as: "transaction_booking",
                    where: {
                        customerId: customerId
                    },
                    attributes: ["bookingCode"]
                }
            ],
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