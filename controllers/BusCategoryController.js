const services = require('../services/BusCategoryService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllBusCates = async (req, res) => {
    try {
        console.log("Controller")
        const response = await services.getAllBusCates(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createBusCate = async (req, res) => {
    try {
        const response = await services.createBusCate(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateBusCate = async (req, res) => {
    try {
        const response = await services.updateBusCate(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deleteBusCate = async (req, res) => {
    try {
        const response = await services.deleteBusCate(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getAllBusCates, createBusCate, updateBusCate, deleteBusCate }