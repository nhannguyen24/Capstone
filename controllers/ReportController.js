const services = require('../services/ReportService')
const {BadRequestError, InternalServerError} = require('../errors/Index')
const { response } = require('express')
const { StatusCodes } = require('http-status-codes')

const getReports = async (req, res) => {
    try {
        const errors = {}
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.page = "Page needs to be a number"
            } else {
                if (parseInt(page) < 1) {
                    errors.page = "Page needs to be 1 or higher"
                }
            }
        } else {
            errors.page = "Page required!"
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.limit = "Limit needs to be a number"
            } else {
                if (parseInt(limit) < 1) {
                    errors.limit = "Limit needs to be 1 or higher"
                }
            }
        } else {
            errors.limit = "Limit required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getReports(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const getReportsById = async (req, res) => {
    try {
        const reportId = req.params.id || ""
        const errors = {}
        if(reportId.trim() === ""){
            errors.reportId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getReportsById(reportId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createReport = async (req, res) => {
    try {
        const errors = {}
        const reportUserId = req.body.reportUserId || ""
        const title = req.body.title || ""
        const description = req.body.description || ""

        if (reportUserId.trim() === "") {
            errors.reportUserId = "Report user id required!"
        }

        if(title.trim() === ""){
            errors.title = "Title required!"
        }

        if(description.trim() === ""){
            errors.description = "Description required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createReport(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updateReport = async (req, res) => {
    try {
        const errors = {}
        const reportId = req.params.id || ""
        const responseUserId = req.body.responseUserId || ""
        const response = req.body.reponse || ""
        const reportStatus = req.body.reportStatus || ""

        if (reportId.trim() === "") {
            errors.reportId = "Id required!"
        }
        if (responseUserId.trim() === "") {
            errors.responseUserId = "Response User id required!"
        }
        if(response.trim() === "" && reportStatus.trim() === ""){
            errors.fields = "Update field required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateReport(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getReports, getReportsById, createReport, updateReport }