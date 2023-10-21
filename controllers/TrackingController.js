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
        const {trackingId} = req.body;
        if(!trackingId) {
            throw new BadRequestError('Please provide trackingId');
        }
        const response = await services.createTracking(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTracking, createTracking};
