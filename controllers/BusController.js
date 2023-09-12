const services = require('../services/BusService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getBusByPlate = async (req, res) => {
    try {
        console.log("Controller")
        const response = await services.getAllBuses(req);
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

module.exports = { getBusByPlate, createBus, updateBus }