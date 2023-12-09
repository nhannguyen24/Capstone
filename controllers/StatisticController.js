const services = require('../services/StatisticService');
const { BadRequestError, InternalServerError } = require('../errors/Index');
const Periodicityenum = require('../enums/PeriodicityEnum');
const { StatusCodes } = require('http-status-codes');

const getStatistics = async (req, res) => {
    try {
        const errors = {}
        const periodicityEnumArray = [Periodicityenum.WEEKLY, Periodicityenum.MONTHLY]
        const periodicity = req.query.periodicity
        const startDate = req.query.startDate || ""
        const endDate = req.query.endDate || ""

        if((startDate === "" && endDate === "") && (periodicity === null || periodicity === undefined)){
            errors.filter = "Date or Periodicity required!"
        } else if (periodicity !== null && periodicity !== undefined) {
            const toUpperCasePeriodicity = periodicity.toUpperCase()
            if (!periodicityEnumArray.includes(toUpperCasePeriodicity)) {
                errors.periodicity = `Invalid periodicity: ${periodicity}!`
            }
        } 

        if((startDate !== "" || endDate !== "") && (periodicity !== null && periodicity !== undefined)){
            errors.filter = "Can only filter between Date or Periodicity!"
        }

        if(startDate !== ""){
            const _startDate = new Date(startDate)
            if(_startDate.toString() === "Invalid Date"){
                errors.startDate = "Start date need to be a date!"
            }
        }

        if(endDate !== ""){
            const _endDate = new Date(endDate)
            if(_endDate.toString() === "Invalid Date"){
                errors.endDate = "End date need to be a date!"
            }
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