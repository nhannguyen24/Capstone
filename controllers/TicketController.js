const services = require('../services/TicketService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getTickets = async (req, res) => {
    try {
        const response = await services.getTickets(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getTicketById = async (req, res) => {
    try {
        const response = await services.getTicketById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createTicket = async (req, res) => {
    try {
        const response = await services.createTicket(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateTicket = async (req, res) => {
    try {
        const response = await services.updateTicket(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const deleteTicket = async (req, res) => {
    try {
        const response = await services.deleteTicket(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket }