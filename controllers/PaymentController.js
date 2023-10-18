const services = require('../services/PaymentService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const paymentMomo = async (req, res) => {
    try {
        const { amount, redirect, bookingId } = req.query;
        const response = await services.createMoMoPaymentRequest(amount, redirect, bookingId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const refundMomo = async (req, res) => {
    try {
        const { bookingId } = req.query;
        const response = await services.refundMomo(bookingId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const getPaymentMomo = async (req, res) => {
    try {
        const response = await services.getMoMoPaymentResponse(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { paymentMomo, refundMomo, getPaymentMomo }