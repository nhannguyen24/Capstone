const services = require('../services/ReportService');
const {BadRequestError, InternalServerError} = require('../errors/Index');
const { response } = require('express');

const getReports = async (req, res) => {
    try {
        const errors = []
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.push("Page needs to be a number");
            } else {
                if (parseInt(page) < 1) {
                    errors.push("Page needs to be 1 or higher");
                }
            }
        } else {
            errors.push("Page required!")
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.push("Limit needs to be a number");
            } else {
                if (parseInt(limit) < 1) {
                    errors.push("Limit needs to be 1 or higher");
                }
            }
        }else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getReports(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
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
        const errors = []
        const customerId = req.body.customerId || ""
        const title = req.body.reponse || ""
        const description = req.body.reponse || ""

        if (customerId.trim() === "") {
            errors.push("customerId required!")
        }

        if(title.trim() === ""){
            errors.push("title required!")
        }

        if(description.trim() === ""){
            errors.push("description required!")
        }

        if (errors.length === 0) {
            const response = await services.createReport(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateReport = async (req, res) => {
    try {
        const errors = []
        const reportId = req.params.id || ""
        const response = req.body.reponse || ""
        const reportStatus = req.body.reportStatus || ""

        if (reportId.trim() === "") {
            errors.push("Id required!")
        }
        if(response === "" && reportStatus === ""){
            errors.push("Update field required!")
        }

        if (errors.length === 0) {
            const response = await services.updateReport(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getReports, getReportsById, createReport, updateReport }