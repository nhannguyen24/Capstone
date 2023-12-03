const services = require('../services/StatisticService');
const { BadRequestError, InternalServerError } = require('../errors/Index');
const Periodicityenum = require('../enums/PeriodicityEnum');
const { StatusCodes } = require('http-status-codes');

const getStatistics = async (req, res) => {
    try {
        const errors = {}
        const periodicityEnumArray = [Periodicityenum.WEEKLY, Periodicityenum.MONTHLY, Periodicityenum.YEARLY]
        const periodicity = req.query.periodicity

        if (periodicity !== null && periodicity !== undefined) {
            const toUpperCasePeriodicity = periodicity.toUpperCase()
            if (!periodicityEnumArray.includes(toUpperCasePeriodicity)) {
                errors.periodicity = `Invalid periodicity: ${periodicity}!`
            }
        } else {
            errors.periodicity = `Periodicity required!`
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getStatistics(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getStatistics }