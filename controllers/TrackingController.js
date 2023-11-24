const services = require('../services/TrackingService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllTracking = async (req, res) => {
    try {
        const response = await services.getAllTracking(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createTracking = async (req, res) => {
    try {
        const response = await services.createTracking(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateTracking = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
            const response = await services.updateTracking(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
        
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTracking, createTracking, updateTracking};
