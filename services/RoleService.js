const db = require('../models');
const { Op } = require('sequelize');
const { StatusCodes } = require("http-status-codes");

const getAllRoles = ({ roleName, ...query }) => new Promise(async (resolve, reject) => {
    try {
        const queries = { raw: true, nest: true };
        if (roleName) query.roleName = { [Op.substring]: roleName }

        const roles = await db.Role.findAll({
            where: query,
            ...queries,
        });
        resolve({
            status: StatusCodes.OK,
            data: {
                msg: roles ? `Got role` : 'Cannot find role',
                roles: roles
            }
        });
    } catch (error) {
        reject(error);
    }
});

module.exports = { getAllRoles };
