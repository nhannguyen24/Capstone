const services = require('../services/TicketService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getTickets = async (req, res) => {
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
            const response = await services.getTickets(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const getTicketById = async (req, res) => {
    try {
        const ticketId = req.params.id || ""
        const errors = {}
        if (ticketId.trim() = "") {
            errors.ticketId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getTicketById(ticketId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createTicket = async (req, res) => {
    try {
        const errors = {}
        const ticketTypeId = req.body.ticketTypeId || ""
        const tourId = req.body.tourId || ""
        if (ticketTypeId.trim() === "") {
            errors.ticketTypeId = "ticketTypeId required!"
        }
        if (tourId.trim() === "") {
            errors.tourId = "tourId required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.createTicket(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updateTicket = async (req, res) => {
    try {
        const errors = {}
        const ticketId = req.params.id || ""
        const ticketTypeId = req.body.ticketTypeId || ""
        const status = req.body.status || ""

        if (ticketId.trim() === "") {
            errors.ticketId = "Id required!"
        }
        if (ticketTypeId.trim() === "" && status.trim() === "") {
            errors.fields = "Update field required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateTicket(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const deleteTicket = async (req, res) => {
    try {
        const ticketId = req.params.id || ""
        const errors = {}
        if (ticketId.trim() = "") {
            errors.ticketId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.deleteTicket(ticketId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}


module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket }