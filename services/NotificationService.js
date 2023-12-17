const db = require("../models");
const { Op } = require("sequelize");
const { StatusCodes } = require("http-status-codes");

const getAllNotification = (
    { page, limit, order, userId, status, createdDate, ...query }
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
            if (createdDate) query.createdDate = { [Op.gte]: createdDate };
            query.status = { [Op.ne]: "Deactive" };
            const notifications = await db.Notification.findAll({
                where: query,
                ...queries,
                include: [
                    {
                        model: db.User,
                        as: "noti_user",
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
                status: StatusCodes.OK,
                data: {
                    msg: notifications ? "Got notifications" : "Cannot find notifications",
                    notifications: notifications,
                }
            });

        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getNotificationById = (notiId) =>
    new Promise(async (resolve, reject) => {
        try {
            const notification = await db.Notification.findOne({
                where: { notiId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.User,
                        as: "noti_user",
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
                status: notification ? StatusCodes.OK : StatusCodes.NOT_FOUND,
                data: {
                    msg: notification ? "Got notification" : `Cannot find notification with id: ${notiId}`,
                    notification: notification,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const updateDeviceToken = (id, body) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                const user = await db.User.update(body, {
                    where: { userId: id },
                    individualHooks: true,
                    transaction: t
                });

                resolve({
                    status: user[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg:
                            user[1].length !== 0
                                ? `User updated`
                                : "Cannot update user/ userId not found",
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

const deleteNotification = (id) =>
    new Promise(async (resolve, reject) => {
        try {
            const findNotification = await db.Notification.findOne({
                raw: true, nest: true,
                where: { notiId: id },
            });

            if (findNotification.status === "Deactive") {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: "The notification already deactive!",
                    }
                });
                return;
            }

            const notifications = await db.Notification.update(
                { status: "Deactive" },
                {
                    where: { notiId: id },
                    individualHooks: true,
                }
            );
            resolve({
                status: notifications[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                data: {
                    msg:
                        notifications[0] > 0
                            ? `${notifications[0]} notification delete`
                            : "Cannot delete notification/ notiId not found",
                }
            });

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateDeviceToken,
    getAllNotification,
    getNotificationById,
    deleteNotification,

};

