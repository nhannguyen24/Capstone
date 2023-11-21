const db = require("../models");
const { Op } = require("sequelize");
const STATUS = require("../enums/ReportStatusEnum");
const { StatusCodes } = require("http-status-codes");
const { sendNotification } = require("../utils/NotificationUtil");

const getAllForm = (
    { page, limit, order, userId, changeEmployee, status, createdDate, ...query }
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
            if (changeEmployee) query.changeEmployee = { [Op.eq]: changeEmployee };
            if (status) query.status = { [Op.eq]: status };
            if (createdDate) query.createdDate = { [Op.gte]: createdDate };
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
                    {
                        model: db.User,
                        as: "form_change_user",
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

            for (const form of forms) {
                const currentTour = await db.Tour.findOne({
                    raw: true, nest: true,
                    where: { tourId: form.currentTour },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                })

                const desireTour = await db.Tour.findOne({
                    raw: true, nest: true,
                    where: { tourId: form.desireTour },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    }
                })

                // console.log(currentTour);
                form.dataValues.currentTour = currentTour
                form.dataValues.desireTour = desireTour
            }

            resolve({
                status: forms ? StatusCodes.OK : StatusCodes.NOT_FOUND,
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
                    {
                        model: db.User,
                        as: "form_change_user",
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
                status: form ? StatusCodes.OK : StatusCodes.NOT_FOUND,
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

            const changeEmployee = await db.User.findOne({
                where: { userId: body.changeEmployee }
            })

            const createNoti = await db.Notification.create({
                title: "Đổi ca",
                body: "Có 1 nhân viên gửi form đổi ca cho bạn!",
                deviceToken: changeEmployee.deviceToken,
                notiType: "Đổi ca",
                userId: body.changeEmployee
            })

            if (createNoti) {
                sendNotification(
                    createNoti.title,
                    createNoti.body,
                    createNoti.deviceToken,
                    createNoti.notiType
                );
            }

            resolve({
                status: StatusCodes.OK,
                data: {
                    msg: "Create new form successfully",
                    form: createForm.dataValues,
                }
            });

        } catch (error) {
            resolve({
                status: StatusCodes.BAD_REQUEST,
                data: {
                    error: error.message,
                    msg: "Cannot create new form",
                }
            });
            reject(error);
        }
    });

const updateForm = (id, body) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const forms = await db.Form.update(body, {
                    where: { formId: id },
                    individualHooks: true,
                    transaction: t
                });

                if (body.status == STATUS.APPROVED) {
                    const form = await db.Form.findOne({
                        where: { formId: id },
                        raw: true,
                    })

                    await db.Tour.update({ tourGuideId: form.changeEmployee }, {
                        where: { tourId: form.currentTour },
                        individualHooks: true,
                        transaction: t
                    });

                    await db.Tour.update({ tourGuideId: form.userId }, {
                        where: { tourId: form.desireTour },
                        individualHooks: true,
                        transaction: t
                    });

                    const changeEmployee = await db.User.findOne({
                        where: { userId: body.changeEmployee }
                    })

                    const createNoti = await db.Notification.create({
                        title: "Đổi ca",
                        body: "Quản lý đã chấp nhận form của bạn!",
                        deviceToken: changeEmployee.deviceToken,
                        notiType: "Đổi ca",
                        userId: body.changeEmployee
                    })

                    if (createNoti) {
                        sendNotification(
                            createNoti.title,
                            createNoti.body,
                            createNoti.deviceToken,
                            createNoti.notiType
                        );
                    };

                    resolve({
                        status: forms[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                        data: {
                            msg:
                                forms[1].length !== 0
                                    ? `Form updated/TourGuideId in Tour updated`
                                    : "Cannot update form/ formId not found",
                        }
                    });
                    return;
                }
                resolve({
                    status: forms[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg:
                            forms[1].length !== 0
                                ? `Form updated`
                                : "Cannot update form/ formId not found",
                    }
                });
                await t.commit();
            });
        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
            reject(error.message);
        }
    });

module.exports = {
    updateForm,
    createForm,
    getAllForm,
    getFormById,
};

