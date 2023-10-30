const services = require('../services/SoundService');
const {BadRequestError, InternalServerError} = require('../errors/Index');
// const joi = require('joi');
// const {soundId, soundIds} = require('../helpers/joi_schema');

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
        if(!soundId) {
            throw new BadRequestError('Please provide soundId');
        }
        const response = await services.getFileSoundById(soundId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createFileSound = async (req, res) => {
    try {
        const {file} = req.body;
        if(!file) {
            throw new BadRequestError('Please provide file');
        }
        const response = await services.createFileSound(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateFileSound = async (req, res) => {
    try {
        const {soundId} = req.body;
        if(!soundId) {
            throw new BadRequestError('Please provide soundId');
        }
        const response = await services.updateFileSound(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteFileSound = async (req, res) => {
    try {
        const {soundId} = req.query;
        if(!soundId) {
            throw new BadRequestError('Please provide soundId');
        }
        const response = await services.deleteFileSound(req.query.soundId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllFileSound, createFileSound, updateFileSound, deleteFileSound, getFileSoundById};
