const services = require('../services/UserService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllUsers = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllUsers(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const createUser = async (req, res) => {
    try {
        // const { error } = joi.object({userName, email, avatar, roleId, password}).validate(req.body);
        // if (error) {
        //     return res.status(400).json({msg: error.details[0].message});
        // }
        const {userName, email, roleId} = req.body;
        if(!userName) {
            throw new BadRequestError('Please provide userName');
        }
        if(!email) {
            throw new BadRequestError('Please provide email');
        }
        if(!roleId) {
            throw new BadRequestError('Please provide roleId');
        }
        // if(!password) {
        //     throw new BadRequestError('Please provide password');
        // }
        const response = await services.createUser(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateUser = async (req, res) => {
    try {
        // const { error } = joi.object({userId}).validate({userId: req.body.userId});
        // if (error) throw new BadRequestError(error.details[0].message);
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updateUser(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateUserPassword = async (req, res) => {
    try {
        let checked = true
        let errors = []
        const {userId, newPassword, confirmPassword} = req.body;
        if(userId.trim() === "" || !userId) {
            const msg = "User required!"
            errors.push(msg)
            checked = false
        }
        if(newPassword.trim() === "" || !newPassword) {
            const msg = "New password required!"
            errors.push(msg)
            checked = false
        }
        if(confirmPassword.trim() === "" || !confirmPassword) {
            const msg = "Confirm password required!"
            errors.push(msg)
            checked = false
        }
        if(newPassword !== confirmPassword){
            const msg = "Both password are not the same!"
            errors.push(msg)
            checked = false
        }
        if(checked){
            const response = await services.updateUserPassword(userId, newPassword, confirmPassword, req.body);
            //return res.status(response.status).json(response.data);
            return res.status(400).json({msg: "HAHAHA"});
        } else {
            const data = {
                status: 400,
                errors: errors
            }
            return res.status(400).json(data);
        }
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

// const updateProfile = async (req, res) => {
//     try {
//         // const { error } = joi.object({userId}).validate({userId: req.body.userId});
//         // if (error) throw new BadRequestError(error.details[0].message);
//         const {userId} = req.user;
//         if(!userId) {
//             throw new BadRequestError('Please provide userId');
//         }
//         const response = await services.updateProfile(req.body, userId);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         console.log(error);
//         throw new InternalServerError(error);
//     }
// };

const deleteUser = async (req, res) => {
    try {
        const {userId} = req.user;
        const {id} = req.params;
        // const { error } = joi.object({userIds}).validate(req.query);
        // if (error) throw new BadRequestError(error.details[0].message);
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.deleteUser(id, userId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const getUserById = async (req, res) => {
    try {
        const { id: userId } = req.params;
        if(!userId) {
            throw new BadRequestError('Please provide userId');
        }
        const response = await services.getUserById(userId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

module.exports = {updateUser, deleteUser, createUser, getAllUsers, updateUserPassword, getUserById};
