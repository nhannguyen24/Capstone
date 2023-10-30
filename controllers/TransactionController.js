const services = require('../services/TransactionService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getTransactions = async (req, res) => {
    try {
        const errors = []
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.push("Page needs to be a number");
            } else {
                if (parseInt(page) < 1) {
                    errors.push("Page needs to be 1 or higher");
                }
            }
        } else {
            errors.push("Page required!")
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.push("Limit needs to be a number");
            } else {
                if (parseInt(limit) < 1) {
                    errors.push("Limit needs to be 1 or higher");
                }
            }
        }else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getTransactions(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const getTransactionById = async (req, res) => {
    try {
        const response = await services.getTransactionById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = {getTransactions, getTransactionById}