const services = require('../services/StationService');
const {InternalServerError} = require('../errors/Index');

const getAllStation = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllStation(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getStationById = async (req, res) => {
    try {
        const { id: stationId } = req.params;
        const errors = {};

        if(stationId.trim() === "") {
            errors.stationId = 'Please provide stationId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getStationById(stationId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createStation = async (req, res) => {
    try {
        const {stationName, address, latitude, longitude} = req.body;
        const errors = {};

        if(stationName.trim() === "") {
            errors.stationName = 'Please provide stationName';
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
            const response = await services.createStation(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateStation = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateStation(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteStation = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteStation(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllStation, createStation, updateStation, deleteStation, getStationById};
