const services = require('../services/RouteService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

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
        const errors = {};

        if(routeId.trim() === "") {
            errors.routeId = 'Please provide routeId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getRouteById(routeId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createRoute = async (req, res) => {
    try {
        const {routeName} = req.body;
        const errors = {};

        if(routeName.trim() === "") {
            errors.routeName = 'Please provide routeName';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createRoute(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateRoute = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateRoute(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteRoute = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }
        
        if (Object.keys(errors).length === 0) {
            const response = await services.deleteRoute(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllRoute, createRoute, updateRoute, deleteRoute, getRouteById};
