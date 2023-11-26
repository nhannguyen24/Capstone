const services = require('../services/NotificationService');
const {InternalServerError} = require('../errors/Index');

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
        const errors = [];

        if(notiId.trim() === "") {
            errors.push('Please provide notiId');
        }

        if (errors.length == 0) {
            const response = await services.getNotificationById(notiId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const updateDeviceToken = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide user id');
        }

        if (errors.length == 0) {
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
        const errors = [];
        
        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
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
