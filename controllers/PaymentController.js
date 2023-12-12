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
            errors.bookingId = "Booking required!"
        }

        if (amount !== "") {
            if (isNaN(amount)) {
                errors.amount = "Amount needs to be a number!"
            } else {
                if (parseInt(amount) < 1000) {
                    errors.amount = "Amount needs to be atleast 1000!"
                }
            }
        } else {
            errors.amount = "Amount required!"
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
const paymentPayOs = async (req, res) => {
    try {
        const amount = req.query.amount || ""
        const bookingId = req.query.bookingId || ""
        const returnUrl = req.query.returnUrl || ""
        const cancelUrl = req.query.cancelUrl || ""
        const errors = {}

        if(bookingId.trim() === ""){
            errors.bookingId = "Booking Id required!"
        }
        if(returnUrl.trim() === ""){
            errors.returnUrl = "Return url required!"
        }
        if(cancelUrl.trim() === ""){
            errors.cancelUrl = "Cancel url required!"
        }

        if (amount !== "") {
            if (isNaN(amount)) {
                errors.amount = "Amount needs to be a number!"
            } else {
                if (parseInt(amount) < 1000) {
                    errors.amount = "Amount needs to be atleast 1000!"
                }
            }
        } else {
            errors.amount = "Amount required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createPayOsPaymentRequest(amount, bookingId, returnUrl, cancelUrl)
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

const getPayOsPaymentResponse = async (req, res) => {
    try {
        const code = req.query.code || ""
        const status = req.query.status || ""
        const orderCode = req.query.orderCode || ""
        const bookingId = req.query.bookingId || ""
        const errors = {}
        if(bookingId.trim() === ""){
            errors.bookingId = "Booking Id required!"
        }
        if(orderCode.trim() === ""){
            errors.orderCode = "Order code required!"
        }
        if(status.trim() === ""){
            errors.status = "Status required!"
        }
        if(code.trim() === ""){
            errors.code = "Code required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getPayOsPaymentResponse(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}


module.exports = { paymentMomo, paymentPayOs, getPaymentMomo, paymentOffline, getPayOsPaymentResponse }