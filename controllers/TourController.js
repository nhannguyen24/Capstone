const services = require('../services/TourService');
const { BadRequestError, InternalServerError } = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllTour = async (req, res) => {
    try {
        const response = await services.test(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getAllTourManager = async (req, res) => {
    try {
        const response = await services.getAllTourManager(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getTourById = async (req, res) => {
    try {
        const { id: tourId } = req.params;
        const errors = {};

        if (tourId.trim() === "") {
            errors.tourId = 'Please provide tourId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getTourById(tourId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }

    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createTour = async (req, res) => {
    try {
        const { tourName, routeId } = req.body;
        const errors = {};

        if (tourName.trim() === "") {
            errors.tourName = 'Please provide tourName';
        }
        if (routeId.trim() === "") {
            errors.routeId = 'Please provide routeId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createTour(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }

    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createTourByFile = async (req, res) => {
    try {
        const uploadedFile = req.file;
        if (!uploadedFile) {
            throw new BadRequestError('File Excel required');
        }
        const fileName = uploadedFile.originalname
        if ("xlsx" !== fileName.slice(-4)) {
            throw new BadRequestError('Excel file type of (xlsx) required');
        }
        const response = await services.createTourByFile(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
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
        const { id } = req.params;
        const errors = {};

        if (id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateTour(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteTour = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = {};

        if (id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteTour(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const cloneTour = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = {};

        if (id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.cloneTour(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createTourDemo = async (req, res) => {
    try {
        const response = await services.createTourDemo();
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

module.exports = { getAllTour, createTour, createTourByFile, updateTour, deleteTour, getTourById, assignTour, cloneTour, getAllTourManager, createTourDemo };
