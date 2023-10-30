const services = require('../services/TicketService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getTickets = async (req, res) => {
    try {
        const errors = []
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.push("Page needs to be a number");
            } else {
                if (parseInt(page) < 1) {
                    errors.push("Page needs to be 1 or higher");
                }
            }
        } else {
            errors.push("Page required!")
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.push("Limit needs to be a number");
            } else {
                if (parseInt(limit) < 1) {
                    errors.push("Limit needs to be 1 or higher");
                }
            }
        }else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getTickets(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
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
        const errors = []
        const ticketTypeId = req.body.ticketTypeId || ""
        const tourId = req.body.tourId || ""
        if(ticketTypeId.trim() === ""){
            errors.push("ticketTypeId required!")
        }
        if(tourId.trim() === ""){
            errors.push("tourId required!")
        }
        if (errors.length === 0) {
            const response = await services.createTicket(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateTicket = async (req, res) => {
    try {
        const errors = []
        const ticketId = req.params.id || ""
        const ticketTypeId = req.body.ticketTypeId || ""
        const tourId = req.body.tourId || ""
        const status = req.body.status || ""

        if(ticketId.trim() === ""){
            errors.push("Id required!")
        }
        if(ticketTypeId.trim() === "" && tourId.trim() === "" && status.trim() === ""){
            errors.push("Update field required!")
        }

        if (errors.length === 0) {
            const response = await services.updateTicket(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
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