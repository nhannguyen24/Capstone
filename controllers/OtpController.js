const services = require('../services/OtpService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const validateOtp = async (req, res) => {
    try {
        const response = await services.validateOtp(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const sendOtpToEmail = async (req, res) => {
    try {
        const response = await services.sendOtpToEmail(req.query.email, req.query.otpType);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}



module.exports = {validateOtp, sendOtpToEmail}