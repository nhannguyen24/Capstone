const services = require('../services/PointOfInterestService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllPointOfInterest = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllPointOfInterest(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getPointOfInterestById = async (req, res) => {
    try {
        const { id: poiId } = req.params;
        if(!poiId) {
            throw new BadRequestError('Please provide poiId');
        }
        const response = await services.getPointOfInterestById(poiId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createPointOfInterest = async (req, res) => {
    try {
        const {poiName, address, latitude, longitude} = req.body;
        if(!poiName) {
            throw new BadRequestError('Please provide poiName');
        }
        if(!address) {
            throw new BadRequestError('Please provide address');
        }
        if(!latitude) {
            throw new BadRequestError('Please provide latitude');
        }
        if(!longitude) {
            throw new BadRequestError('Please provide longitude');
        }
        const response = await services.createPointOfInterest(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updatePointOfInterest = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updatePointOfInterest(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deletePointOfInterest = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.deletePointOfInterest(id);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllPointOfInterest, createPointOfInterest, updatePointOfInterest, deletePointOfInterest, getPointOfInterestById};
