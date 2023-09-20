const services = require('../services/BookingService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getBookingDetailByBookingId = async (req, res) => {
    try {
        const response = await services.getBookingDetailByBookingId(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getBookingsForCustomer = async (req, res) => {
    try {
        const response = await services.getBookingsForCustomer(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getBookingsForManager = async (req, res) => {
    try {
        const response = await services.getBookingsForManager(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getBookingsByEmail = async (req, res) => {
    try {
        const response = await services.getBookingsByEmail(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const createBooking = async (req, res) => {
    try {
        const response = await services.createBooking(req);
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

module.exports = { getBookingDetailByBookingId, getBookingsForCustomer, getBookingsForManager, getBookingsByEmail, createBooking, updateBooking, deleteBooking }