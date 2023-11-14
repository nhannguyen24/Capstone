const services = require('../services/PriceService');
const { BadRequestError, InternalServerError } = require('../errors/Index');

const getPrices = async (req, res) => {
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
            const response = await services.getPrices(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getPriceById = async (req, res) => {
    try {
        const response = await services.getPriceById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createPrice = async (req, res) => {
    try {
        const errors = []
        const amount = req.body.amount || ""
        const ticketTypeId = req.body.ticketTypeId || ""
        const day = req.body.day || ""
        if(ticketTypeId === ""){
            errors.push("ticketTypeId required!")
        }
        if(day === ""){
            errors.push("Day required!")
        }
        if(amount === ""){
            errors.push("Amount required!")
        } else {
            if (isNaN(amount)) {
                errors.push("Amount needs to be a number");
            } else {
                if (parseInt(amount) < 1000) {
                    errors.push("Amount needs to be at least 1000")
                }
            }
        }
        if (errors.length === 0) {
            const response = await services.createPrice(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updatePrice = async (req, res) => {
    try {
        const errors = []
        const priceId = req.params.id || ""
        const amount = req.body.amount || ""
        const ticketTypeId = req.params.ticketTypeId || ""
        const day = req.body.day || ""
        if (priceId.trim() === "") {
            errors.push("Id required!")
        }
        if (ticketTypeId.trim() === "") {
            errors.push("ticketTypeId required!")
        }
        if (day.trim() === "") {
            errors.push("day required!")
        }
        if (amount === "") {
            errors.push("amount field required!")
        }
        if (amount !== "") {
            if (isNaN(amount)) {
                errors.push("Amount needs to be a number");
            } else {
                if (parseInt(amount) < 10000) {
                    errors.push("Amount needs to be at least 10000")
                }
            }
        }
        if (errors.length === 0) {
            const response = await services.updatePrice(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getPrices, getPriceById, createPrice, updatePrice }