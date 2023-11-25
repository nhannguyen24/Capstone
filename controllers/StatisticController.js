const services = require('../services/StatisticService');
const { BadRequestError, InternalServerError } = require('../errors/Index');
const BookingStatusEnum = require('../enums/BookingStatusEnum');
const TourStatusEnum = require('../enums/TourStatusEnum');
const { StatusCodes } = require('http-status-codes');

const getStatistics = async (req, res) => {
    try {
        const errors = {}
        const bookingStatusEnumArray = [BookingStatusEnum.ON_GOING, BookingStatusEnum.CANCELED, BookingStatusEnum.FINISHED]
        const tourStatusEnumArray = [TourStatusEnum.AVAILABLE, TourStatusEnum.STARTED, TourStatusEnum.CANCELED, TourStatusEnum.FINISHED]
        const bookingStatus = req.query.bookingStatus
        const tourStatus = req.query.tourStatus

        if (bookingStatus !== null && bookingStatus !== undefined) {
            const bookingStatusArray = bookingStatus.split(',')
            for (const status of bookingStatusArray) {
                if (!bookingStatusEnumArray.includes(status)) {
                    errors.bookingStatus = `Invalid booking status: ${status}`
                }
            }
        }
        if (tourStatus !== null && tourStatus !== undefined) {
            const tourStatusArray = tourStatus.split(',')
            for (const status of tourStatusArray) {
                if (!tourStatusEnumArray.includes(status)) {
                    errors.tourStatus = `Invalid tour status: ${status}`
                }
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