const services = require('../services/TransactionService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getTransactions = async (req, res) => {
    try {
        const response = await services.getTransactions(req);
        return res.status(response.status).json(response.data);
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