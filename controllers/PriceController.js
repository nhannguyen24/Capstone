const services = require('../services/PriceService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getPrices = async (req, res) => {
    try {
        const response = await services.getPrices(req);
        return res.status(response.status).json(response.data);
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
        const response = await services.createPrice(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updatePrice = async (req, res) => {
    try {
        const response = await services.updatePrice(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deletePrice = async (req, res) => {
    try {
        const response = await services.deletePrice(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getPrices, getPriceById, createPrice, updatePrice, deletePrice }