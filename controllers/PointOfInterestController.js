const services = require('../services/PointOfInterestService');
const {BadRequestError, InternalServerError} = require('../errors/Index');
// const joi = require('joi');
// const {poiId, poiIds} = require('../helpers/joi_schema');

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
        const response = await services.getStationById(poiId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createPointOfInterest = async (req, res) => {
    try {
        const {poiName, address, latitude, longtitude} = req.body;
        if(!poiName) {
            throw new BadRequestError('Please provide poiName');
        }
        if(!address) {
            throw new BadRequestError('Please provide address');
        }
        if(!latitude) {
            throw new BadRequestError('Please provide latitude');
        }
        if(!longtitude) {
            throw new BadRequestError('Please provide longtitude');
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
        // const { error } = joi.object({poiId}).validate({poiId: req.body.poiId});
        // if (error) throw new BadRequestError(error.details[0].message);
        const {poiId} = req.body;
        if(!poiId) {
            throw new BadRequestError('Please provide poiId');
        }
        const response = await services.updatePointOfInterest(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deletePointOfInterest = async (req, res) => {
    try {
        // const { error } = joi.object({poiIds}).validate(req.query);
        // if (error) throw new BadRequestError(error.details[0].message);
        const {poiIds} = req.query;
        if(!poiIds) {
            throw new BadRequestError('Please provide poiIds');
        }
        const response = await services.deletePointOfInterest(req.query.poiIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllPointOfInterest, createPointOfInterest, updatePointOfInterest, deletePointOfInterest, getPointOfInterestById};
