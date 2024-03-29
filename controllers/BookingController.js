const services = require('../services/BookingService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getBookingDetailByBookingId = async (req, res) => {
    try {
        const bookingId = req.params.id || ""
        const errors = {}
        if (bookingId.trim() === "") {
            errors.bookingId = "Booking required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getBookingDetailByBookingId(bookingId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getBookings = async (req, res) => {
    try {
        const errors = {}
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
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
            const response = await services.getBookings(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getBookingsByEmail = async (req, res) => {
    try {
        const email = req.query.email || ""
        const page = parseInt(req.query.page) || ""
        const limit = parseInt(req.query.limit) || ""
        const errors = {}
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
        if (email.trim() === "") {
            errors.email = "Email required!"
        } else if (!emailRegex.test(email)) {
            errors.email = "Invalid email address!"
        }

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
            const response = await services.getBookingsByEmail(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const createBookingWeb = async (req, res) => {
    try {
        const errors = {}
        const totalPrice = req.body.totalPrice || ""
        const departureStationId = req.body.departureStationId || ""
        const user = req.body.user
        const tickets = req.body.tickets
        if (totalPrice === "") {
            errors.totalPrice = "Total price required!"
        } else {
            if (isNaN(totalPrice)) {
                errors.totalPrice = "Total price needs to be a number"
            } else {
                if (parseInt(totalPrice) < 1000) {
                    errors.totalPrice = "Total price needs to be atleast 1000"
                }
            }
        }
        if (departureStationId.trim() === "") {
            errors.departureStationId = "Departure station required!"
        }
        if (user.userName === null && user.userName === undefined && user.userName.trim() === "") {
            errors.userName = "User name required!"
        }
        if (user.email === null && user.email === undefined && user.email.trim() === "") {
            errors.email = "Email required!"
        } else {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
            if (!emailRegex.test(user.email)) {
                errors.email = "Invalid email address!"
            }
        }
        if (user.phone === null && user.phone === undefined && user.phone.trim() === "") {
            errors.phone = "Phone required!"
        } else {
            const cleanedPhone = user.phone.replace(/\s/g, '')
            if (!/^\d+$/.test(cleanedPhone)) {
                errors.phone = "Phone can only contain digits!";
            } else if (cleanedPhone.length !== 10) {
                errors.phone = "Phone need to be length of 10 digits!"
            }
        }

        for (const ticket of tickets) {
            if (isNaN(ticket.quantity)) {
                errors.ticket(`Ticket quantity must be a number!`)
            } else if (ticket.quantity < 0) {
                errors.ticket(`Ticket quantity must be atleast 0!`)
            }
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createBookingWeb(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const createBookingOffline = async (req, res) => {
    try {
        const errors = {}
        const totalPrice = req.body.totalPrice || ""
        const departureStationId = req.body.departureStationId || ""
        if (totalPrice === "") {
            errors.totalPrice = "Total price required!"
        } else {
            if (isNaN(totalPrice)) {
                errors.totalPrice = "Total price needs to be a number"
            } else {
                if (parseInt(totalPrice) < 1000) {
                    errors.totalPrice = "Total price needs to be atleast 1000"
                }
            }
        }
        if (departureStationId.trim() === "") {
            errors.departureStationId = "departureStationId required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createBookingOffline(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const checkInQrCode = async (req, res) => {
    try {
        const bookingId = req.params.id || ""
        const scheduleId = req.query.scheduleId || ""

        const errors = {}

        if (bookingId.trim() === "") {
            errors.bookingId = "Booking required!"
        }
        if (scheduleId.trim() === "") {
            errors.scheduleId = "Tour schedule required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.checkInQrCode(bookingId, scheduleId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id || ""
        const errors = {}

        if (bookingId.trim() === "") {
            errors.bookingId = "Booking required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.cancelBooking(bookingId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBookingWeb, createBookingOffline, checkInQrCode, cancelBooking }
