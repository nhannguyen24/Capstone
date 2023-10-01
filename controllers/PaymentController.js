const services = require('../services/PaymentService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const paymentMomo = async (req, res) => {
    try {
        const response = await services.createMoMoPaymentRequest();
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { paymentMomo }