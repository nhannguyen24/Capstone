const services = require('../services/PriceService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getPrices = async (req, res) => {
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
            const response = await services.getPrices(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getPriceById = async (req, res) => {
    try {
        const priceId = req.params.id || ""
        const errors = {}

        if(priceId.trim() === ""){
            errors.priceId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getPriceById(priceId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createPrice = async (req, res) => {
    try {
        const errors = {}
        const amount = req.body.amount || ""
        const ticketTypeId = req.body.ticketTypeId || ""
        const day = req.body.day || ""
        if(ticketTypeId === ""){
            errors.ticketTypeId = "ticketTypeId required!"
        }
        if(day === ""){
            errors.day = "Day required!"
        }
        if(amount === ""){
            errors.amount = "Amount required!"
        } else {
            if (isNaN(amount)) {
                errors.amount = "Amount needs to be a number!"
            } else {
                if (parseInt(amount) < 1000) {
                    errors.amount = "Amount needs to be at least 1000"
                }
            }
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.createPrice(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updatePrice = async (req, res) => {
    try {
        const errors = {}
        const priceId = req.params.id || ""
        const amount = req.body.amount || ""
        const ticketTypeId = req.params.ticketTypeId || ""
        const day = req.body.day || ""
        if (priceId.trim() === "") {
            errors.priceId = "Id required!"
        }
        if (ticketTypeId.trim() === "") {
            errors.ticketTypeId = "ticketTypeId required!"
        }
        if (day.trim() === "") {
            errors.day = "day required!"
        }
        if (amount === "") {
            errors.amount = "amount field required!"
        } else {
            if (isNaN(amount)) {
                errors.push("Amount needs to be a number!")
            } else {
                if (parseInt(amount) < 10000) {
                    errors.push("Amount needs to be at least 10000")
                }
            }
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.updatePrice(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getPrices, getPriceById, createPrice, updatePrice }