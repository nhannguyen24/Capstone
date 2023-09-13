const services = require('../services/PriceService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllPrices = async (req, res) => {
    try {
        const response = await services.getAllPrices(req);
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

module.exports = { getAllPrices, createPrice, updatePrice, deletePrice }