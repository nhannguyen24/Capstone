const services = require('../services/FeedbackService');
const { BadRequestError, InternalServerError } = require('../errors/Index');

const getFeedbacks = async (req, res) => {
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
        } else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getFeedbacks(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getFeedbackById = async (req, res) => {
    try {
        const response = await services.getFeedbackById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createFeedback = async (req, res) => {
    try {
        const errors = []
        const customerId = req.body.customerId || ""
        const routeId = req.body.routeId || ""
        const stars = req.body.stars || ""

        if (customerId.trim() === "") {
            errors.push("User required!")
        }
        if (routeId.trim() === "") {
            errors.push("Route required!")
        }
        if (stars === "") {
            errors.push("Stars required!")
        } else {
            if (isNaN(stars)) {
                errors.push("Stars needs to be a number");
            } else {
                if (parseInt(stars) < 1 || parseInt(stars) > 5) {
                    errors.push("Stars needs to be in range [1-5]");
                }
            }
        }

        if (errors.length === 0) {
            const response = await services.createFeedback(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }

    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateFeedback = async (req, res) => {
    try {
        const errors = []
        const feedbackId = req.params.id || ""
        const stars = req.body.stars || ""
        const description = req.body.description || ""

        if (feedbackId.trim() === "") {
            errors.push("Id required!")
        }
        if (stars === "" && description.trim() === "") {
            errors.push("Update field required!")
        } else {
            if (stars !== "") {
                if (isNaN(stars)) {
                    errors.push("Stars needs to be a number");
                } else {
                    if (parseInt(stars) < 1 || parseInt(stars) > 5) {
                        errors.push("Stars needs to be in range [1-5]");
                    }
                }
            }
        }

        if (errors.length === 0) {
            const response = await services.updateFeedback(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deleteFeedback = async (req, res) => {
    try {
        const response = await services.deleteFeedback(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback }