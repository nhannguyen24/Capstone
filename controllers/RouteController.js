const services = require('../services/RouteService');
const {BadRequestError, InternalServerError} = require('../errors/Index');
// const joi = require('joi');
// const {routeId, routeIds} = require('../helpers/joi_schema');

const getAllRoute = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllRoute(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getRouteById = async (req, res) => {
    try {
        const { id: routeId } = req.params;
        if(!routeId) {
            throw new BadRequestError('Please provide routeId');
        }
        const response = await services.getRouteById(routeId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createRoute = async (req, res) => {
    try {
        const {routeName, address, latitude, longitude} = req.body;
        if(!routeName) {
            throw new BadRequestError('Please provide routeName');
        }
        const response = await services.createRoute(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log('aa', error);
        throw new InternalServerError(error);
    }
};

const updateRoute = async (req, res) => {
    try {
        // const { error } = joi.object({routeId}).validate({routeId: req.body.routeId});
        // if (error) throw new BadRequestError(error.details[0].message);
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updateRoute(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteRoute = async (req, res) => {
    try {
        // const { error } = joi.object({routeIds}).validate(req.query);
        // if (error) throw new BadRequestError(error.details[0].message);
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.deleteRoute(id);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllRoute, createRoute, updateRoute, deleteRoute, getRouteById};
