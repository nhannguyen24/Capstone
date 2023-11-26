const services = require('../services/OtpService')
const {BadRequestError, InternalServerError} = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const validateOtp = async (req, res) => {
    try {
        const response = await services.validateOtp(req)
        return res.status(response.status).json(response.data)
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const sendOtpToEmail = async (req, res) => {
    try {
        const email = req.query.email || ""
        const errors = {}

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
        if (email.trim() === "") {
            errors.email = "Email required!"
        } else if (!emailRegex.test(email)) {
            errors.email = "Invalid email address!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.sendOtpToEmail(email, null, null, req.query.otpType)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }

    } catch (error) {
        throw new InternalServerError(error)
    }
}



module.exports = {validateOtp, sendOtpToEmail}