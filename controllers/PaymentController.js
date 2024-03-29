const services = require('../services/PaymentService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const paymentMomo = async (req, res) => {
    try {
        const amount = req.query.amount || ""
        const redirect = req.query.redirect || ""
        const bookingId = req.query.bookingId || ""
        const errors = {}

        if (bookingId.trim() === "") {
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
        const cancelUrl = req.query.cancelUrl || ""
        const errors = {}

        if (bookingId.trim() === "") {
            errors.bookingId = "Booking Id required!"
        }
        if (cancelUrl.trim() === "") {
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
            const response = await services.createPayOsPaymentRequest(amount, bookingId, cancelUrl)
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
        if (bookingId.trim() === "") {
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
        services.getPayOsPaymentResponse(req)
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const paymentStripe = async (req, res) => {
    try {
        const amount = req.query.amount || ""
        const success_url = req.query.success_url || ""
        const cancel_url = req.query.cancel_url || ""
        const bookingId = req.query.bookingId || ""
        const errors = {}

        if (bookingId.trim() === "") {
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
            const response = await services.createStripePaymentRequest(amount, bookingId, success_url, cancel_url)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}

const paidScheduleTransaction = async (req, res) => {
    try {
        const errors = {}
        const scheduleId = req.query.scheduleId || ""
        if(scheduleId.trim() === ""){
            errors.scheduleId = "Tour schedule required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.paidScheduleTransaction(scheduleId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { paymentMomo, paymentPayOs, getPaymentMomo, paymentOffline, getPayOsPaymentResponse, paymentStripe, paidScheduleTransaction }