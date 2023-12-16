const services = require('../services/SoundService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllFileSound = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllFileSound(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getFileSoundById = async (req, res) => {
    try {
        const { id: soundId } = req.params;
        const errors = {};

        if(soundId.trim() === "") {
            errors.soundId = 'Please provide soundId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getFileSoundById(soundId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createFileSound = async (req, res) => {
    try {
        const {file} = req.body;
        const errors = {};

        if(file.trim() === "") {
            errors.file = 'Please provide file';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createFileSound(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateFileSound = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateFileSound(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteFileSound = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteFileSound(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllFileSound, createFileSound, updateFileSound, deleteFileSound, getFileSoundById};
