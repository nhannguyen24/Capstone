const services = require('../services/LanguageService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllLanguage = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllLanguage(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getLanguageById = async (req, res) => {
    try {
        const { id: languageId } = req.params;
        if(!languageId) {
            throw new BadRequestError('Please provide languageId');
        }
        const response = await services.getLanguageById(languageId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createLanguage = async (req, res) => {
    try {
        const {language} = req.body;
        if(!language) {
            throw new BadRequestError('Please provide language');
        }
        const response = await services.createLanguage(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateLanguage = async (req, res) => {
    try {
        const {languageId} = req.body;
        if(!languageId) {
            throw new BadRequestError('Please provide languageId');
        }
        const response = await services.updateLanguage(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteLanguage = async (req, res) => {
    try {
        const {languageId} = req.query;
        if(!languageId) {
            throw new BadRequestError('Please provide languageId');
        }
        const response = await services.deleteLanguage(req.query.languageId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllLanguage, createLanguage, updateLanguage, deleteLanguage, getLanguageById};
