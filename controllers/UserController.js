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
        const {userName, email, roleId, password} = req.body;
        if(!userName) {
            throw new BadRequestError('Please provide userName');
        }
        if(!email) {
            throw new BadRequestError('Please provide email');
        }
        if(!roleId) {
            throw new BadRequestError('Please provide roleId');
        }
        if(!password) {
            throw new BadRequestError('Please provide password');
        }
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
        const {userId} = req.body;
        if(!userId) {
            throw new BadRequestError('Please provide userId');
        }
        const response = await services.updateUser(req.body);
        return res.status(response.status).json(response.data);
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
        const {delUserId} = req.query;
        // const { error } = joi.object({userIds}).validate(req.query);
        // if (error) throw new BadRequestError(error.details[0].message);
        if(!delUserId) {
            throw new BadRequestError('Please provide delUserId');
        }
        const response = await services.deleteUser(req.query.delUserId, userId);
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

module.exports = {updateUser, deleteUser, createUser, getAllUsers, getUserById};