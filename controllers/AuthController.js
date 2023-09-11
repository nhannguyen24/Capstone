const services = require('../services/AuthService');
const {BadRequestError, InternalServerError} = require('../errors/Index');
// const joi = require('joi');
// const {refreshToken, studentId} = require('../helpers/joi_schema');

const loginGoogle = async (req, res) => {
    try {
        const {email: email} = req.user;
        if(!email) {
            throw new BadRequestError('Please provide email');
        }
        const response = await services.loginGoogle(req.user);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        // const { error } = joi.object({refreshToken}).validate(req.body);
        // if (error) {
        //     return res.status(400).json({msg: error.details[0].message});
        // }
        const {refreshToken: refreshToken} = req.body;
        if(!refreshToken) {
            throw new BadRequestError('Please provide refreshToken');
        }
        const response = await services.refreshAccessToken(req.body.refreshToken);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const logout = async (req, res) => {
    try {
        // const { error } = joi.object({studentId}).validate(req.query);
        // if (error) {
        //     return res.status(400).json({msg: error.details[0].message});
        // }
        const {userId: userId} = req.params;
        if(!userId) {
            throw new BadRequestError('Please provide userId');
        }
        const response = await services.logout(req.query.userId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const register = async (req, res) => {
    try {
        const {email: email, password: password, confirmPass: confirmPass} = req.body;
        if(!email) {
            throw new BadRequestError('Please provide email');
        }
        if(!password) {
            throw new BadRequestError('Please provide password');
        }
        if(!confirmPass) {
            throw new BadRequestError('Please provide confirm password');
        }
        const response = await services.register(req.body)
        return res.status(response.status).json(response.data)

    } catch (error) {
        throw new InternalServerError(error);
    }
}

const login = async (req, res) => {
    try {
        const {email: email, password: password} = req.body;
        if(!email) {
            throw new BadRequestError('Please provide email');
        }
        if(!password) {
            throw new BadRequestError('Please provide password');
        }
        const response = await services.login(req.body)
        return res.status(response.status).json(response.data)
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
}

module.exports = {refreshAccessToken, logout, login, register, loginGoogle };
