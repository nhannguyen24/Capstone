const services = require('../services/StatisticService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getStatistics = async (req, res) => {
    try {
        const response = await services.getStatistics();
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}


module.exports = { getStatistics }