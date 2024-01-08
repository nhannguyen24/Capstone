const services = require('../services/TransactionService')
const {BadRequestError, InternalServerError} = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getTransactions = async (req, res) => {
    try {
        const errors = {}
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.page = "Page needs to be a number"
            } else {
                if (parseInt(page) < 1) {
                    errors.page = "Page needs to be 1 or higher"
                }
            }
        } else {
            errors.page = "Page required!"
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.limit = "Limit needs to be a number"
            } else {
                if (parseInt(limit) < 1) {
                    errors.limit = "Limit needs to be 1 or higher"
                }
            }
        } else {
            errors.limit = "Limit required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getTransactions(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const paidBackToManager = async (req, res) => {
    try {
        const errors = {}
        const tourId = req.query.tourId || ""
        if(tourId === ""){
            errors.tourId = "Tour id required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.paidBackToManager(tourId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getTransactionById = async (req, res) => {
    try {
        const transactionId = req.params.id || ""
        const errors = {}
        if(transactionId.trim() === ""){
            errors.transactionId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getTransactionById(transactionId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = {getTransactions, getTransactionById, paidBackToManager}