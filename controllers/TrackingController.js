const services = require('../services/TrackingService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllTracking = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllTracking(req.query, roleName);
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
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updateTracking(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTracking, createTracking, updateTracking};
