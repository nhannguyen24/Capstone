const services = require('../services/AuthService');
const {InternalServerError} = require('../errors/Index');
const { StatusCodes } = require('http-status-codes');

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
        const errors = {}

        if(!email){
            errors.email = "Email required!"
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
            if (!emailRegex.test(email)) {
                errors.email = "Invalid email format!";
            }
        }

        if(password.trim() === "") {
            errors.password = "Password required!"
        } else {
            if (/\s/.test(password)) {
                errors.password = "Password cannot contain whitespace!"
            } else if (password.trim().length < 6) {
                errors.password = "Password must be at least 6 characters long!"
            }
        }

        if(confirmPass.trim() === "") {
            errors.confirmPass = "Confirm password required!"
        }
        if(password.trim() !== confirmPass.trim()){
            errors.confirmPass = "Both password are not the same!"
        }

        if(Object.keys(errors).length === 0){
            const response = await services.register(req.body)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const login = async (req, res) => {
    try {
        const {email: email, password: password} = req.body;
        const errors = {}

        if (email.trim() === "") {
            errors.email = 'Email required!'
        }
        if(password.trim() === "") {
            errors.password = 'Password required!'
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.login(req.body);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const forgotPassword = async (req, res) => {
    try {
        const errors = {}
        const email = req.body.email || "";
        const newPassword = req.body.newPassword || "";
        const confirmPassword = req.body.confirmPassword || "";
        if(email.trim() === ""){
            errors.email = "Email required!"
        }else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
            if (!emailRegex.test(email)) {
                errors.email = "Invalid email format!";
            }
        }

        if(newPassword.trim() === "") {
            errors.newPassword = "New password required!"
        } else {
            if (/\s/.test(newPassword)) {
                errors.newPassword = "Password cannot contain whitespace!"
            }
        
            if (newPassword.length < 6) {
                errors.newPassword = "Password must be at least 6 characters long!"
            }
        }

        if(confirmPassword.trim() === "") {
            errors.confirmPassword = "Confirm password required!"
        }
        if(newPassword !== confirmPassword){
            errors.confirmPassword = "Both password are not the same!"
        }
        if(Object.keys(errors).length === 0){
            const response = await services.forgotPassword(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {refreshAccessToken, logout, login, register, forgotPassword, loginGoogle };
