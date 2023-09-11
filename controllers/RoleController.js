const services = require('../services/RoleService');
const {BadRequestError, InternalServerError} = require('../errors');

const getAllRoles = async (req, res) => {
    try {
        const response = await services.getAllRoles(req.query);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

module.exports = { getAllRoles }