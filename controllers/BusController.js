const services = require('../services/BusService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getBusByPlate = async (req, res) => {
    try {
        const response = await services.getAllBuses(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getBusById = async (req, res) => {
    try {
        const response = await services.getBusById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createBus = async (req, res) => {
    try {
        const response = await services.createBus(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateBus = async (req, res) => {
    try {
        const response = await services.updateBus(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deleteBus = async (req, res) => {
    try {
        const response = await services.deleteBus(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getBusByPlate, getBusById, createBus, updateBus, deleteBus }