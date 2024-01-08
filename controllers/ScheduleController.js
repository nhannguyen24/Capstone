const services = require('../services/ScheduleService');
const { BadRequestError, InternalServerError } = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllSchedule = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllSchedule(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const getScheduleTransactionList = async (req, res) => {
    try {
        const errors = {}
        const tourGuideId = req.query.tourGuideId || ""
        const isPaidToManager = req.query.isPaidToManager || ""
        if(tourGuideId.trim() === ""){
            errors.tourGuideId = "Tour guide required!"
        }
        if(isPaidToManager.trim() === ""){
            errors.isPaidToManager = "Is paid to manager field required!"
        } else if(typeof isPaidToManager === "boolean"){
            errors.isPaidToManager = "Is paid to manager need to be a boolean value!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getScheduleTransactionList(tourGuideId, isPaidToManager)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getScheduleTransactionDetail = async (req, res) => {
    try {
        const errors = {}
        const scheduleId = req.params.scheduleId || ""
        if(scheduleId === ""){
            errors.scheduleId = "Tour schedule required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getScheduleTransactionDetail(scheduleId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getScheduleById = async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const errors = {};

        if (scheduleId.trim() === "") {
            errors.tourId = 'Please provide scheduleId';
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getScheduleById(scheduleId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createSchedule = async (req, res) => {
    try {
        const {tourId} = req.body;
        const errors = {};

        if (tourId.trim() === "") {
            errors.tourName = 'Please provide tourId';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createSchedule(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = {};

        if (id.trim() === "") {
            errors.id = 'Please provide id';
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.updateSchedule(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = {};

        if (id.trim() === "") {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteSchedule(id);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllSchedule, createSchedule, updateSchedule, deleteSchedule, getScheduleById, getScheduleTransactionList, getScheduleTransactionDetail};
