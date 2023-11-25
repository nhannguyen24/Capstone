const services = require('../services/FeedbackService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getFeedbacks = async (req, res) => {
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
            const response = await services.getFeedbacks(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const getFeedbackById = async (req, res) => {
    try {
        const feedbackId = req.params.id || ""
        const errors = {}

        if (feedbackId.trim() === "") {
            errors.feedbackId = "Id required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getFeedbackById(feedbackId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createFeedback = async (req, res) => {
    try {
        const errors = {}
        const customerId = req.body.customerId || ""
        const routeId = req.body.routeId || ""
        const stars = req.body.stars || ""

        if (customerId.trim() === "") {
            errors.customerId = "customerId required!"
        }
        if (routeId.trim() === "") {
            errors.routeId = "routeId required!"
        }
        if (stars === "") {
            errors.stars = "Stars required!"
        } else {
            if (isNaN(stars)) {
                errors.stars = "Stars needs to be a number!"
            } else {
                if (parseInt(stars) < 1 || parseInt(stars) > 5) {
                    errors.stars = "Stars needs to be in range [1-5]"
                }
            }
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.createFeedback(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updateFeedback = async (req, res) => {
    try {
        const errors = {}
        const feedbackId = req.params.id || ""
        const stars = req.body.stars || ""
        const description = req.body.description || ""

        if (feedbackId.trim() === "") {
            errors.feedbackId = "Id required!"
        }
        if (stars === "" && description.trim() === "") {
            errors.fields = "Update field required!"
        } else {
            if (stars !== "") {
                if (isNaN(stars)) {
                    errors.stars = "Stars needs to be a number!"
                } else {
                    if (parseInt(stars) < 1 || parseInt(stars) > 5) {
                        errors.stars = "Stars needs to be in range [1-5]"
                    }
                }
            }
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateFeedback(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const deleteFeedback = async (req, res) => {
    try {
        const feedbackId = req.params.id || ""
        const errors = {}

        if (feedbackId.trim() === "") {
            errors.feedbackId = "Id required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.deleteFeedback(feedbackId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback }