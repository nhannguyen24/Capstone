const services = require('../services/TourService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllTour = async (req, res) => {
    try {
        const response = await services.getAllTour(req.query);
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
        const {tourName, routeId} = req.body;
        if(!tourName) {
            throw new BadRequestError('Please provide tourName');
        }
        if(!routeId) {
            throw new BadRequestError('Please provide routeId');
        }
        const response = await services.createTour(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const createTourByFile = async (req, res) => {
    try {
        const uploadedFile = req.file;
        if(!uploadedFile){
            throw new BadRequestError('File Excel required');
        } 
        const fileName = uploadedFile.originalname
        if("xlsx" !== fileName.slice(-4)){
            throw new BadRequestError('Excel file type of (xlsx) required');
        }
        const response = await services.createTourByFile(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const assignTour = async (req, res) => {
    try {
        const response = await services.assignTour();
        return res.status(response.status).json(response.data);
    } catch (error) {
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
        const {tourId} = req.query;
        if(!tourId) {
            throw new BadRequestError('Please provide tourId');
        }
        const response = await services.deleteTour(req.query.tourId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTour, createTour, createTourByFile, updateTour, deleteTour, getTourById, assignTour};
