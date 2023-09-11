const services = require('../services/StationService');
const {BadRequestError, InternalServerError} = require('../errors');
// const joi = require('joi');
// const {stationId, stationIds} = require('../helpers/joi_schema');

const getAllStation = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllStation(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createStation = async (req, res) => {
    try {
        const {stationName, address, latitude, longtitude} = req.body;
        if(!stationName) {
            throw new BadRequestError('Please provide stationName');
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
        const response = await services.createStation(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateStation = async (req, res) => {
    try {
        // const { error } = joi.object({stationId}).validate({stationId: req.body.stationId});
        // if (error) throw new BadRequestError(error.details[0].message);
        const {stationId} = req.body;
        if(!stationId) {
            throw new BadRequestError('Please provide stationId');
        }
        const response = await services.updateStation(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteStation = async (req, res) => {
    try {
        // const { error } = joi.object({stationIds}).validate(req.query);
        // if (error) throw new BadRequestError(error.details[0].message);
        const {stationIds} = req.query;
        if(!stationIds) {
            throw new BadRequestError('Please provide stationIds');
        }
        const response = await services.deleteStation(req.query.stationIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllStation, createStation, updateStation, deleteStation};
