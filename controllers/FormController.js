const services = require('../services/FormService');
const {InternalServerError} = require('../errors/Index');

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
        const errors = [];

        if(formId.trim() === "") {
            errors.push('Please provide formId');
        }

        if (errors.length == 0) {
            const response = await services.getFormById(formId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createForm = async (req, res) => {
    try {
        const { userId } = req.user;
        const {currentTour} = req.body;
        const errors = [];

        if(currentTour.trim() === "") {
            errors.push('Please provide currentTour');
        }

        if (errors.length == 0) {
            const response = await services.createForm(req.body, userId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateForm = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
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
