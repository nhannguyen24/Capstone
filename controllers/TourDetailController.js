const services = require('../services/TourDetailService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllTourDetail = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllTourDetail(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateTourDetail = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updateTourDetail(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTourDetail, updateTourDetail};
