const services = require('../services/UserService')
const {InternalServerError} = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getAllUsers = async (req, res) => {
    try {
        const { roleName } = req.user
        const response = await services.getAllUsers(req.query, roleName)
        return res.status(response.status).json(response.data)
    } catch (error) {
        console.log(error)
        throw new InternalServerError(error)
    }
}

const createUser = async (req, res) => {
    try {
        const {userName, email, roleId} = req.body
        const errors = []

        if(userName.trim() === "") {
            errors.push('Please provide userName')
        }
        if(email.trim() === "") {
            errors.push('Please provide email')
        }
        if(roleId.trim() === "") {
            errors.push('Please provide roleId')
        }

        if (errors.length == 0) {
            const response = await services.createUser(req.body)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        console.log(error)
        throw new InternalServerError(error)
    }
}

const updateUser = async (req, res) => {
    try {
        const {id} = req.params
        const errors = []

        if(id.trim() === "") {
            errors.push('Please provide id')
        }

        if (errors.length == 0) {
            const response = await services.updateUser(id, req.body)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
        
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const changeUserPassword = async (req, res) => {
    try {
        const errors = {}
        const newPassword = req.body.newPassword || ""
        const confirmPassword = req.body.confirmPassword || ""
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
            errors.password = "Both password are not the same!"
        }
        if(Object.keys(errors).length === 0){
            const response = await services.changeUserPassword(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        console.log(error)
        throw new InternalServerError(error)
    }
}

// const updateProfile = async (req, res) => {
//     try {
//         // const { error } = joi.object({userId}).validate({userId: req.body.userId})
//         // if (error) throw new BadRequestError(error.details[0].message)
//         const {userId} = req.user
//         if(!userId) {
//             throw new BadRequestError('Please provide userId')
//         }
//         const response = await services.updateProfile(req.body, userId)
//         return res.status(response.status).json(response.data)
//     } catch (error) {
//         console.log(error)
//         throw new InternalServerError(error)
//     }
// }

const deleteUser = async (req, res) => {
    try {
        const {userId} = req.user
        const {id} = req.params
        const errors = []

        if(id.trim() === "") {
            errors.push('Please provide id')
        }

        if (errors.length == 0) {
            const response = await services.deleteUser(id, userId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
        
    } catch (error) {
        console.log(error)
        throw new InternalServerError(error)
    }
}

const getUserById = async (req, res) => {
    try {
        const { id: userId } = req.params
        const errors = []

        if (userId.trim() === "") {
            errors.push('Please provide userId')
        }
        
        if (errors.length == 0) {
            const response = await services.getUserById(userId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        console.log(error)
        throw new InternalServerError(error.message)
    }
}

module.exports = {updateUser, deleteUser, createUser, getAllUsers, changeUserPassword, getUserById}
