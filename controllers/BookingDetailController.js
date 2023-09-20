const services = require('../services/BookingDetailService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllBookings = async (req, res) => {
    try {
        const response = await services.getAllBookings(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getBookingById = async (req, res) => {
    try {
        const response = await services.getBookingById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const updateBooking = async (req, res) => {
    try {
        const response = await services.updateBooking(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deleteBooking = async (req, res) => {
    try {
        const response = await services.deleteBooking(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getAllBookings, getBookingById, updateBooking, deleteBooking }