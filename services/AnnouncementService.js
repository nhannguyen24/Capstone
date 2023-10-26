const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllAnnouncement = (
    { page, limit, order, title, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`announcements_${page}_${limit}_${order}_${title}_${status}`, async (error, announcement) => {
                if (announcement != null && announcement != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got announcements",
                            announcements: JSON.parse(announcement),
                        }
                    });
                } else {
                    redisClient.get(`admin_announcements_${page}_${limit}_${order}_${title}_${status}`, async (error, adminAnnouncement) => {
                        if (adminAnnouncement != null && adminAnnouncement != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got announcements",
                                    announcements: JSON.parse(adminAnnouncement),
                                }
                            });
                        } else {
                            const queries = { nest: true };
                            const offset = !page || +page <= 1 ? 0 : +page - 1;
                            const flimit = +limit || +process.env.LIMIT_POST;
                            queries.offset = offset * flimit;
                            queries.limit = flimit;
                            if (order) queries.order = [[order]]
                            else {
                                queries.order = [['updatedAt', 'DESC']];
                            }
                            if (title) query.title = { [Op.substring]: title };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const announcements = await db.Announcement.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: [
                                        "managerId",
                                    ],
                                },
                                include: [
                                    {
                                        model: db.User,
                                        as: "announcement_user",
                                        attributes: ["userId", "userName", "email"],
                                    },
                                ],
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`announcements_${page}_${limit}_${order}_${title}_${status}`, 3600, JSON.stringify(announcements));
                            } else {
                                redisClient.setEx(`admin_announcements_${page}_${limit}_${order}_${title}_${status}`, 3600, JSON.stringify(announcements));
                            }
                            resolve({
                                status: announcements ? 200 : 404,
                                data: {
                                    msg: announcements ? "Got announcements" : "Cannot find announcements",
                                    announcements: announcements,
                                }
                            });
                        }
                    })
                }
            })
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getAnnouncementById = (announcementId) =>
    new Promise(async (resolve, reject) => {
        try {
            const announcement = await db.Announcement.findOne({
                where: { announcementId: announcementId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["managerId", "createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.User,
                        as: "announcement_user",
                        attributes: ["userId", "userName", "email"],
                    },
                ],
            });
            resolve({
                status: announcement ? 200 : 404,
                data: {
                    msg: announcement ? "Got announcement" : `Cannot find announcement with id: ${announcementId}`,
                    announcement: announcement,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createAnnouncement = ({ title, ...body }, userId) =>
    new Promise(async (resolve, reject) => {
        try {
            // console.log(title);
            // console.log(userId);
            const createAnnouncement = await db.Announcement.findOrCreate({
                where: {
                    title: title
                },
                defaults: {
                    title: title,
                    managerId: userId,
                    ...body,
                },
            });

            resolve({
                status: createAnnouncement[1] ? 200 : 400,
                data: {
                    msg: createAnnouncement[1]
                        ? "Create new announcement successfully"
                        : "Cannot create new announcement/Title already exists",
                    announcement: createAnnouncement[1] ? createAnnouncement[0].dataValues : null,
                }
            });
            redisClient.keys('*announcements_*', (error, keys) => {
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

        } catch (error) {
            reject(error);
        }
    });

const updateAnnouncement = ({ announcementId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const announcement = await db.Announcement.findOne({
                where: {
                    title: body?.title,
                    announcementId: {
                        [Op.ne]: announcementId
                    }
                }
            })

            if (announcement !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Title already exists"
                    }
                });
                return;
            } else {
                const announcements = await db.Announcement.update(body, {
                    where: { announcementId },
                    individualHooks: true,
                });

                console.log(announcements);

                resolve({
                    status: announcements[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            announcements[1].length !== 0
                                ? `Announcement update`
                                : "Cannot update announcement/ announcementId not found",
                    }
                });

                redisClient.keys('*announcements_*', (error, keys) => {
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
        } catch (error) {
            reject(error.message);
        }
    });


const deleteAnnouncement = (announcementIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findAnnouncement = await db.Announcement.findAll({
                raw: true, nest: true,
                where: { announcementId: announcementIds },
            });

            for (const announcement of findAnnouncement) {
                if (announcement.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The announcement already deactive!",
                        }
                    });
                }
            }

            const announcements = await db.Announcement.update(
                { status: "Deactive" },
                {
                    where: { announcementId: announcementIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: announcements[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        announcements[0] > 0
                            ? `${announcements[0]} announcement delete`
                            : "Cannot delete announcement/ announcementId not found",
                }
            });

            redisClient.keys('*announcements_*', (error, keys) => {
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

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateAnnouncement,
    deleteAnnouncement,
    createAnnouncement,
    getAllAnnouncement,
    getAnnouncementById
};

