const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllForm = (
    { page, limit, order, userId, status, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            const queries = { nest: true };
            const offset = !page || +page <= 1 ? 0 : +page - 1;
            const flimit = +limit || +process.env.LIMIT_POST;
            queries.offset = offset * flimit;
            queries.limit = flimit;
            if (order) queries.order = [[order]]
            else {
                queries.order = [['updatedAt', 'DESC']];
            }
            if (userId) query.userId = { [Op.eq]: userId };
            if (status) query.status = { [Op.eq]: status };
            const forms = await db.Form.findAll({
                where: query,
                ...queries,
                include: [
                    {
                        model: db.User,
                        as: "form_user",
                        attributes: [
                            "userId",
                            "userName",
                            "email",
                            "phone",
                        ],
                        include: [
                            {
                                model: db.Role,
                                as: "user_role",
                                attributes: [
                                    "roleId",
                                    "roleName",
                                ],
                            },
                        ]
                    },
                ]
            });

            resolve({
                status: forms ? 200 : 404,
                data: {
                    msg: forms ? "Got forms" : "Cannot find forms",
                    forms: forms,
                }
            });

        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getFormById = (formId) =>
    new Promise(async (resolve, reject) => {
        try {
            const form = await db.Form.findOne({
                where: { formId: formId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.User,
                        as: "form_user",
                        attributes: [
                            "userId",
                            "userName",
                            "email",
                            "phone",
                        ],
                        include: [
                            {
                                model: db.Role,
                                as: "user_role",
                                attributes: [
                                    "roleId",
                                    "roleName",
                                ],
                            },
                        ]
                    },
                ]
            });
            resolve({
                status: form ? 200 : 404,
                data: {
                    msg: form ? "Got form" : `Cannot find form with id: ${formId}`,
                    form: form,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createForm = (body, userId) =>
    new Promise(async (resolve, reject) => {
        try {
            const createForm = await db.Form.create(
                { 
                    userId: userId, 
                    ...body 
                });

            resolve({
                status: 200,
                data: {
                    msg: "Create new form successfully",
                    form: createForm.dataValues,
                }
            });

        } catch (error) {
            resolve({
                status: 400,
                data: {
                    error: error.message,
                    msg: "Cannot create new form",
                }
            });
            reject(error);
        }
    });

const updateForm = ({ formId, ...query }) =>
    new Promise(async (resolve, reject) => {
        try {
            const forms = await db.Form.update(query, {
                where: { formId },
                individualHooks: true,
            });

            resolve({
                status: forms[1].length !== 0 ? 200 : 400,
                data: {
                    msg:
                        forms[1].length !== 0
                            ? `Form update`
                            : "Cannot update form/ formId not found",
                }
            });
        } catch (error) {
            reject(error.message);
        }
    });

module.exports = {
    updateForm,
    createForm,
    getAllForm,
    getFormById,
};

