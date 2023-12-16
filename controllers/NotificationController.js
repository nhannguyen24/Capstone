const services = require('../services/NotificationService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllNotification = async (req, res) => {
    try {
        const response = await services.getAllNotification(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getNotificationById = async (req, res) => {
    try {
        const { id: notiId } = req.params;
        const errors = {};

        if(notiId.trim() === "") {
            errors.notiId = 'Please provide notiId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getNotificationById(notiId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error.message);
    }
};

const updateDeviceToken = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(id.trim() === "") {
            errors.id = 'Please provide user id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateDeviceToken(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteNotification = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};
        
        if(id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteNotification(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllNotification, updateDeviceToken, getNotificationById, deleteNotification};
