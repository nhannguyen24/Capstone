const services = require('../services/AnnouncementService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

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
        if(!announcementId) {
            throw new BadRequestError('Please provide announcementId');
        }
        const response = await services.getAnnouncementById(announcementId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const {title} = req.body;
        const { userId } = req.user;
        if(!title) {
            throw new BadRequestError('Please provide title');
        }
        console.log(title);
        const response = await services.createAnnouncement(req.body, userId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const {announcementId} = req.body;
        if(!announcementId) {
            throw new BadRequestError('Please provide announcementId');
        }
        const response = await services.updateAnnouncement(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const {announcementIds} = req.query;
        if(!announcementIds) {
            throw new BadRequestError('Please provide announcementIds');
        }
        const response = await services.deleteAnnouncement(req.query.announcementIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementById};
