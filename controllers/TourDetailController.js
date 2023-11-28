const services = require('../services/TourDetailService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require("http-status-codes");

const getAllTourDetail = async (req, res) => {
    try {
        const response = await services.getAllTourDetail(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateTourDetail = async (req, res) => {
    try {
        const {id} = req.params;
        const errors = {};

        if(!id) {
            errors.id = 'Please provide id';
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.updateTourDetail(id, req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
        
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTourDetail, updateTourDetail};
