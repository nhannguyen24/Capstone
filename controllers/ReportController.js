const services = require('../services/ReportService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getReports = async (req, res) => {
    try {
        const response = await services.getReports(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getReportsById = async (req, res) => {
    try {
        const response = await services.getReportsById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createReport = async (req, res) => {
    try {
        const response = await services.createReport(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateReport = async (req, res) => {
    try {
        const response = await services.updateReport(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getReports, getReportsById, createReport, updateReport }