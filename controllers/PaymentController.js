const services = require('../services/PaymentService')
const {BadRequestError, InternalServerError} = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const paymentMomo = async (req, res) => {
    try {
        const amount = req.query.amount || ""
        const redirect = req.query.redirect || ""
        const bookingId = req.query.bookingId || ""
        const errors = {}

        if(bookingId.trim() === ""){
            errors.bookingId = "bookingId required!"
        }

        if (amount !== "") {
            if (isNaN(amount)) {
                errors.amount = "amount needs to be a number!"
            } else {
                if (parseInt(amount) < 1000) {
                    errors.amount = "amount needs to be atleast 1000!"
                }
            }
        } else {
            errors.amount = "amount required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createMoMoPaymentRequest(amount, redirect, bookingId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}
const paymentOffline = async (req, res) => {
    try {
        const bookingId = req.query.bookingId || ""
        const errors = {}
        if(bookingId.trim() === ""){
            errors.bookingId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.paymentOffline(bookingId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getPaymentMomo = async (req, res) => {
    try {
        const response = await services.getMoMoPaymentResponse(req)
        return res.status(response.status).json(response.data)
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { paymentMomo, getPaymentMomo, paymentOffline }