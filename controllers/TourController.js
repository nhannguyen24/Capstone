const services = require('../services/TourService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllTour = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllTour(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getTourById = async (req, res) => {
    try {
        const { id: tourId } = req.params;
        if(!tourId) {
            throw new BadRequestError('Please provide tourId');
        }
        const response = await services.getTourById(tourId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createTour = async (req, res) => {
    try {
        const {tourName} = req.body.tourName;
        if(!tourName) {
            throw new BadRequestError('Please provide tourName');
        }
        // if(!address) {
        //     throw new BadRequestError('Please provide address');
        // }
        // if(!latitude) {
        //     throw new BadRequestError('Please provide latitude');
        // }
        // if(!longitude) {
        //     throw new BadRequestError('Please provide longitude');
        // }
        const response = await services.createTour(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateTour = async (req, res) => {
    try {
        const {tourId} = req.body;
        if(!tourId) {
            throw new BadRequestError('Please provide tourId');
        }
        const response = await services.updateTour(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteTour = async (req, res) => {
    try {
        const {tourIds} = req.query;
        if(!tourIds) {
            throw new BadRequestError('Please provide tourIds');
        }
        const response = await services.deleteTour(req.query.tourIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTour, createTour, updateTour, deleteTour, getTourById};
