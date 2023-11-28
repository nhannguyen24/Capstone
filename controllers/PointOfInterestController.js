const services = require('../services/PointOfInterestService');
const {InternalServerError} = require('../errors/Index');

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
        const errors = {};

        if(poiId.trim() === "") {
            errors.poiId = 'Please provide poiId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getPointOfInterestById(poiId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createPointOfInterest = async (req, res) => {
    try {
        const {poiName, address, latitude, longitude} = req.body;
        const errors = {};

        if(poiName.trim() === "") {
            errors.poiName = 'Please provide poiName';
        }
        if(address.trim() === "") {
            errors.address = 'Please provide address';
        }
        if(!latitude) {
            errors.latitude = 'Please provide latitude';
        }
        if(!longitude) {
            errors.longitude = 'Please provide longitude';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createPointOfInterest(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updatePointOfInterest = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updatePointOfInterest(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deletePointOfInterest = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }
        
        if (Object.keys(errors).length === 0) {
            const response = await services.deletePointOfInterest(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllPointOfInterest, createPointOfInterest, updatePointOfInterest, deletePointOfInterest, getPointOfInterestById};
