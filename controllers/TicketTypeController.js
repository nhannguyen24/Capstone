const services = require('../services/TicketTypeService')
const { InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getTicketTypes = async (req, res) => {
    try {
        const response = await services.getTicketTypes(req)
        return res.status(response.status).json(response.data)
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const getTicketTypeById = async (req, res) => {
    try {
        const ticketTypeId = req.params.id || ""
        const errors = {}
        if(ticketTypeId.trim() === ""){
            errors.ticketTypeId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getTicketTypeById(ticketTypeId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createTicketType = async (req, res) => {
    try {
        const errors = {}
        const ticketTypeName = req.body.ticketTypeName || ""
        const description = req.body.description || ""
        if(ticketTypeName.trim() === ""){
            errors.ticketTypeName = "ticketTypeName required!"
        }
        if(description.trim() === ""){
            errors.description = "description required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.createTicketType(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updateTicketType = async (req, res) => {
    try {
        const errors = {}
        const ticketTypeId = req.params.id || ""
        const ticketTypeName = req.body.ticketTypeName || ""
        const description = req.body.description || ""
        const dependsOnGuardian = req.body.dependsOnGuardian
        if(ticketTypeId.trim() === ""){
            errors.ticketTypeId = "Id required!"
        }
        if(ticketTypeName.trim() === "" && description.trim() === "" && (dependsOnGuardian === null || dependsOnGuardian === undefined)){
            errors.fields = "Update field required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateTicketType(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getTicketTypes, getTicketTypeById, createTicketType, updateTicketType }