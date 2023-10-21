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
        const {tourDetailId} = req.body;
        if(!tourDetailId) {
            throw new BadRequestError('Please provide tourDetailId');
        }
        const response = await services.updateTourDetail(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = {getAllTourDetail, updateTourDetail};
