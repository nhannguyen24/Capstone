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
        const errors = [];

        if(poiId.trim() === "") {
            errors.push('Please provide poiId');
        }

        if (errors.length == 0) {
            const response = await services.getPointOfInterestById(poiId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createPointOfInterest = async (req, res) => {
    try {
        const {poiName, address, latitude, longitude} = req.body;
        const errors = [];

        if(poiName.trim() === "") {
            errors.push('Please provide poiName');
        }
        if(address.trim() === "") {
            errors.push('Please provide address');
        }
        if(!latitude) {
            errors.push('Please provide latitude');
        }
        if(!longitude) {
            errors.push('Please provide longitude');
        }

        if (errors.length == 0) {
            const response = await services.createPointOfInterest(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updatePointOfInterest = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
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
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }
        
        if (errors.length == 0) {
            const response = await services.deletePointOfInterest(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllPointOfInterest, createPointOfInterest, updatePointOfInterest, deletePointOfInterest, getPointOfInterestById};
