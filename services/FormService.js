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
                const currentSchedule = await db.Schedule.findOne({
                    nest: true,
                    where: { scheduleId: form.currentSchedule },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: [
                        {
                            model: db.Tour,
                            as: "schedule_tour",
                            attributes: {
                                exclude: [
                                    "createdAt",
                                    "updatedAt",
                                    "status",
                                ],
                            },
                        }
                    ]
                })

                const desireSchedule = await db.Schedule.findOne({
                    nest: true,
                    where: { scheduleId: form.desireSchedule },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    include: [
                        {
                            model: db.Tour,
                            as: "schedule_tour",
                            attributes: {
                                exclude: [
                                    "createdAt",
                                    "updatedAt",
                                    "status",
                                ],
                            },
                        }
                    ]
                })

                form.dataValues.currentSchedule = currentSchedule
                form.dataValues.desireSchedule = desireSchedule
            }

            resolve({
                status: StatusCodes.OK,
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

            const currentSchedule = await db.Schedule.findOne({
                nest: true,
                where: { scheduleId: form.currentSchedule },
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                include: [
                    {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    }
                ]
            })

            const desireSchedule = await db.Schedule.findOne({
                nest: true,
                where: { scheduleId: form.desireSchedule },
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                include: [
                    {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    }
                ]
            })

            form.dataValues.currentSchedule = currentSchedule
            form.dataValues.desireSchedule = desireSchedule

            resolve({
                status: StatusCodes.OK,
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
            const findSchedule = await db.Schedule.findOne({
                where: { scheduleId: body.currentSchedule }
            })

            if (!findSchedule) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Cannot find current schedule with id: ${body.currentSchedule}!`,
                    }
                });
                return;
            }

            const findDesireSchedule = await db.Schedule.findOne({
                where: { scheduleId: body.desireSchedule }
            })

            if (!findDesireSchedule) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Cannot find desire schedule with id: ${body.desireSchedule}!`,
                    }
                });
                return;
            }

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
                body: "Có 1 nhân viên đã gửi đổi ca cho bạn!",
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
                const formUpdate = await db.Form.update(body, {
                    where: { formId: id },
                    individualHooks: true,
                    transaction: t
                });

                if (body.status == STATUS.APPROVED) {
                    const form = await db.Form.findOne({
                        where: { formId: id },
                        raw: true,
                    })

                    await db.Schedule.update({ tourGuideId: form.changeEmployee }, {
                        where: { scheduleId: form.currentSchedule },
                        individualHooks: true,
                        transaction: t
                    });

                    await db.Schedule.update({ tourGuideId: form.userId }, {
                        where: { scheduleId: form.desireSchedule },
                        individualHooks: true,
                        transaction: t
                    });

                    const changeEmployee = await db.User.findOne({
                        where: { userId: form.changeEmployee }
                    })

                    const createNoti = await db.Notification.create({
                        title: "Phản hồi đổi ca",
                        body: "Quản lý đã chấp nhận yêu cầu của bạn!",
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

                    if (formUpdate[1].length !== 0) {
                        redisClient.keys('*tours_*', (error, keys) => {
                            if (error) {
                                console.error('Error retrieving keys:', error)
                                return
                            }
                            // Delete each key individually
                            keys.forEach((key) => {
                                redisClient.del(key, (deleteError, reply) => {
                                    if (deleteError) {
                                        console.error(`Error deleting key ${key}:`, deleteError)
                                    } else {
                                        console.log(`Key ${key} deleted successfully`)
                                    }
                                })
                            })
                        })
    
                        redisClient.keys('*schedules_*', (error, keys) => {
                            if (error) {
                                console.error('Error retrieving keys:', error);
                                return;
                            }
                            // Delete each key individually
                            keys.forEach((key) => {
                                redisClient.del(key, (deleteError, reply) => {
                                    if (deleteError) {
                                        console.error(`Error deleting key ${key}:`, deleteError);
                                    } else {
                                        console.log(`Key ${key} deleted successfully`);
                                    }
                                });
                            });
                        });
                    }

                    resolve({
                        status: formUpdate[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                        data: {
                            msg:
                            formUpdate[1].length !== 0
                                    ? `Form updated/TourGuideId in Schdeule of Tour updated`
                                    : "Cannot update form/ formId not found",
                        }
                    });
                    return;
                }
                if (formUpdate[1].length !== 0) {
                    redisClient.keys('*tours_*', (error, keys) => {
                        if (error) {
                            console.error('Error retrieving keys:', error)
                            return
                        }
                        // Delete each key individually
                        keys.forEach((key) => {
                            redisClient.del(key, (deleteError, reply) => {
                                if (deleteError) {
                                    console.error(`Error deleting key ${key}:`, deleteError)
                                } else {
                                    console.log(`Key ${key} deleted successfully`)
                                }
                            })
                        })
                    })

                    redisClient.keys('*schedules_*', (error, keys) => {
                        if (error) {
                            console.error('Error retrieving keys:', error);
                            return;
                        }
                        // Delete each key individually
                        keys.forEach((key) => {
                            redisClient.del(key, (deleteError, reply) => {
                                if (deleteError) {
                                    console.error(`Error deleting key ${key}:`, deleteError);
                                } else {
                                    console.log(`Key ${key} deleted successfully`);
                                }
                            });
                        });
                    });
                }
                
                resolve({
                    status: formUpdate[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg:
                        formUpdate[1].length !== 0
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

