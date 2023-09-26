const services = require('../services/ScheduleService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllSchedule = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllSchedule(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};


const getScheduleById = async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        if(!scheduleId) {
            throw new BadRequestError('Please provide scheduleId');
        }
        const response = await services.getScheduleById(scheduleId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createSchedule = async (req, res) => {
    try {
        const {tourId, tourGuideId, driverId} = req.body;
        if(!tourId) {
            throw new BadRequestError('Please provide tourId');
        }
        if(!tourGuideId) {
            throw new BadRequestError('Please provide tourGuideId');
        }
        if(!driverId) {
            throw new BadRequestError('Please provide driverId');
        }
        const response = await services.createSchedule(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateSchedule = async (req, res) => {
    try {
        const {scheduleId} = req.body;
        if(!scheduleId) {
            throw new BadRequestError('Please provide scheduleId');
        }
        const response = await services.updateSchedule(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const {scheduleIds} = req.query;
        if(!scheduleIds) {
            throw new BadRequestError('Please provide scheduleIds');
        }
        const response = await services.deleteSchedule(req.query.scheduleIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllSchedule, createSchedule, updateSchedule, deleteSchedule, getScheduleById};
