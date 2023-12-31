const services = require('../services/FormService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllForm = async (req, res) => {
    try {
        const response = await services.getAllForm(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getFormById = async (req, res) => {
    try {
        const { id: formId } = req.params;
        const errors = {};

        if(formId.trim() === "") {
            errors.formId = 'Please provide formId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getFormById(formId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createForm = async (req, res) => {
    try {
        const { userId } = req.user;
        const {currentSchedule, desireSchedule} = req.body;
        const errors = {};

        if(currentSchedule.trim() === "") {
            errors.currentSchedule = 'Please provide currentSchedule';
        }
        if(desireSchedule.trim() === "") {
            errors.desireSchedule = 'Please provide desireSchedule';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createForm(req.body, userId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateForm = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateForm(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllForm, createForm, updateForm, getFormById};
