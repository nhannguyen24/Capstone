const services = require('../services/AnnouncementService');
const {InternalServerError} = require('../errors/Index');

const getAllAnnouncement = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllAnnouncement(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getAnnouncementById = async (req, res) => {
    try {
        const { id: announcementId } = req.params;
        const errors = [];

        if(announcementId.trim() === "") {
            errors.push('Please provide announcementId');
        }

        if (errors.length == 0) {
            const response = await services.getAnnouncementById(announcementId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const {title} = req.body;
        const { userId } = req.user;
        const errors = [];

        if(title.trim() === "") {
            errors.push('Please provide title');
        }

        if (errors.length == 0) {
            const response = await services.createAnnouncement(req.body, userId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
            const response = await services.updateAnnouncement(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = [];

        if(id.trim() === "") {
            errors.push('Please provide id');
        }

        if (errors.length == 0) {
            const response = await services.deleteAnnouncement(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementById};
