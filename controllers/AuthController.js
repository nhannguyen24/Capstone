const services = require('../services/AuthService');
const {InternalServerError} = require('../errors/Index');

const loginGoogle = async (req, res) => {
    try {
        const {email: email} = req.user;
        const errors = [];

        if(email.trim() === "") {
            errors.push('Please provide email');
        }

        if (errors.length == 0) {
            const response = await services.loginGoogle(req.user);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const {refreshToken: refreshToken} = req.body;
        const errors = [];

        if(refreshToken.trim() === "") {
            errors.push('Please provide refreshToken');
        }

        if (errors.length == 0) {
            const response = await services.refreshAccessToken(req.body.refreshToken);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const logout = async (req, res) => {
    try {
        const {userId} = req.query;
        const errors = [];

        if(userId.trim() === "") {
            errors.push('Please provide userId');
        }

        if (errors.length == 0) {
            const response = await services.logout(req.query.userId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const register = async (req, res) => {
    try {
        const {email: email, password: password, confirmPass: confirmPass} = req.body;
        const errors = [];

        if(email.trim() === "") {
            errors.push('Please provide email');
        }
        if(password.trim() === "") {
            errors.push('Please provide password');
        }
        if(confirmPass.trim() === "") {
            errors.push('Please provide password');
        }

        if (errors.length == 0) {
            const response = await services.register(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const login = async (req, res) => {
    try {
        const {email: email, password: password} = req.body;
        const errors = [];

        if (email.trim() === "") {
            errors.push('Please provide email');
        }
        if(password.trim() === "") {
            errors.push('Please provide password');
        }

        if (errors.length == 0) {
            const response = await services.login(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
}

module.exports = {refreshAccessToken, logout, login, register, loginGoogle };
