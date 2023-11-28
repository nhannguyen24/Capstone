const services = require('../services/LanguageService');
const {InternalServerError} = require('../errors/Index');

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
        const errors = {};

        if(languageId.trim() === "") {
            errors.languageId = 'Please provide languageId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getLanguageById(languageId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const createLanguage = async (req, res) => {
    try {
        const {language} = req.body;
        const errors = {};

        if(language.trim() === "") {
            errors.language = 'Please provide language';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createLanguage(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateLanguage = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateLanguage(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteLanguage = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteLanguage(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllLanguage, createLanguage, updateLanguage, deleteLanguage, getLanguageById};
