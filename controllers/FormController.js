const services = require('../services/FormService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

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
        if(!formId) {
            throw new BadRequestError('Please provide formId');
        }
        const response = await services.getFormById(formId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createForm = async (req, res) => {
    try {
        const { userId } = req.user;
        const {currentTour} = req.body;
        if(!currentTour) {
            throw new BadRequestError('Please provide currentTour');
        }
        const response = await services.createForm(req.body, userId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateForm = async (req, res) => {
    try {
        const {formId} = req.body;
        if(!formId) {
            throw new BadRequestError('Please provide formId');
        }
        const response = await services.updateForm(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllForm, createForm, updateForm, getFormById};
