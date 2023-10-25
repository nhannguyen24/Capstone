const services = require('../services/TicketTypeService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getTicketTypes = async (req, res) => {
    try {
        const response = await services.getTicketTypes(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getTicketTypeById = async (req, res) => {
    try {
        const response = await services.getTicketTypeById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createTicketType = async (req, res) => {
    try {
        const response = await services.createTicketType(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateTicketType = async (req, res) => {
    try {
        const response = await services.updateTicketType(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}
// const deleteTicketType = async (req, res) => {
//     try {
//         const response = await services.deleteTicketType(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// }

module.exports = { getTicketTypes, getTicketTypeById, createTicketType, updateTicketType }